import { addTodoComment, copySyntheticComments } from "@/helpers/comments";
import {
  createConstStatement,
  createIdentifier,
  getDecorators,
  rocketToken,
} from "@/helpers/tsHelpers";
import { registerDecorator } from "@/transformer/registry";
import {
  VxReferenceKind,
  VxResultKind,
  VxResultToComposable,
  VxTransform,
  VxTransformResult,
} from "@/types";
import ts, { isCallExpression } from "typescript";
import { instanceDependencies } from "../../utils/instancePropertyAccess";

const u = undefined;

export function transformVuexMethodFactory(
  decoratorName: "Action" | "Mutation",
  storeProperty: "dispatch" | "commit",
): VxTransform<ts.PropertyDeclaration> {
  const isAsync = decoratorName === "Action";

  return (node) => {
    const decorators = getDecorators(node, decoratorName);
    const methodName = node.name.getText();

    if (!decorators || decorators.length <= 0) return { shouldContinue: true };
    if (decorators.length > 1)
      throw new Error(`[vuex-class] Duplicate @${decoratorName} decorators for ${methodName}`);

    registerDecorator(decoratorName);

    const decorator = decorators[0];
    let decoratorArgs: ts.Expression | undefined;
    if (isCallExpression(decorator.expression)) {
      decoratorArgs = decorator.expression.arguments[0];
    }

    const storeKeyName = decoratorArgs ?? ts.factory.createStringLiteral(methodName);
    const value = createArrowFn(storeKeyName, storeProperty, isAsync, node.type);
    const constStatement = createConstStatement(methodName, value);
    copySyntheticComments(constStatement, node);

    if (!node.type || !ts.isFunctionTypeNode(node.type)) {
      addTodoComment(constStatement, `Check function dispatch call signature.`);
    }

    const storeComposable = instanceDependencies.get("$store") as VxResultToComposable;
    return {
      shouldContinue: false,
      result: [
        storeComposable,
        {
          kind: VxResultKind.COMPOSITION,
          reference: VxReferenceKind.VARIABLE,
          imports: [],
          outputVariables: [methodName],
          nodes: [constStatement],
          tag: `VuexMethod-${decoratorName}`,
        } as VxTransformResult<ts.VariableStatement>,
      ],
    };
  };
}

function createArrowFn(
  storeKeyName: ts.Identifier | ts.Expression,
  storeProperty: "dispatch" | "commit",
  isAsync: boolean,
  nodeType: ts.TypeNode | undefined,
) {
  const maybeAsyncKeyword = isAsync
    ? [ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)]
    : undefined;
  let params: ts.NodeArray<ts.ParameterDeclaration>;
  let typeRef: ts.TypeNode;
  let payloadArgs: ts.NodeArray<ts.Expression>;

  if (!nodeType || !ts.isFunctionTypeNode(nodeType)) {
    let argsId: ts.Identifier;
    [params, typeRef, argsId] = unknownMethodType(isAsync);
    payloadArgs = ts.factory.createNodeArray([storeKeyName, argsId]);
  } else {
    params = nodeType.parameters;
    const payloadName = params[0].name.getText();
    const args = [storeKeyName];
    if (payloadName) args.push(createIdentifier(payloadName));
    payloadArgs = ts.factory.createNodeArray(args);

    typeRef =
      isAsync && !isPromiseType(nodeType)
        ? ts.factory.createTypeReferenceNode("Promise", [nodeType.type])
        : nodeType.type;
  }

  const methodCall = createMethodReturn(payloadArgs, storeProperty);

  const arrowFn = ts.factory.createArrowFunction(
    maybeAsyncKeyword,
    u,
    params,
    typeRef,
    rocketToken(),
    methodCall,
  );

  return arrowFn;
}

function createMethodReturn(
  params: ts.NodeArray<ts.Expression>,
  propertyName: "dispatch" | "commit",
) {
  const storeId = ts.factory.createIdentifier("store");
  const callId = ts.factory.createIdentifier(propertyName);
  const accessExpr = ts.factory.createPropertyAccessExpression(storeId, callId);
  const callExpr = ts.factory.createCallExpression(accessExpr, undefined, params);

  return callExpr;
}

function unknownMethodType(
  isAsync: boolean,
): [
  parameters: ts.NodeArray<ts.ParameterDeclaration>,
  typeReference: ts.TypeReferenceNode | ts.KeywordTypeNode,
  argsId: ts.Identifier,
] {
  const unknownType = () => ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword);
  const argsId = ts.factory.createIdentifier("args");
  const argsType = ts.factory.createArrayTypeNode(unknownType());
  const dotDotDot = ts.factory.createToken(ts.SyntaxKind.DotDotDotToken);
  const param = ts.factory.createParameterDeclaration(u, dotDotDot, argsId, u, argsType);
  const params = ts.factory.createNodeArray<ts.ParameterDeclaration>([param]);
  const typeReference = isAsync
    ? ts.factory.createTypeReferenceNode("Promise", [unknownType()])
    : unknownType();
  return [params, typeReference, argsId];
}

function isPromiseType(node: ts.FunctionTypeNode | undefined) {
  if (!node) return false;
  if (!ts.isTypeReferenceNode(node.type)) return false;
  const typeName = node.type.typeName.getText();
  return typeName === "Promise";
}

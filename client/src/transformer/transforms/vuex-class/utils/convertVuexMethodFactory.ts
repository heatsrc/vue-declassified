import { addTodoComment, copySyntheticComments } from "@/helpers/comments";
import {
  createConstStatement,
  createIdentifier,
  getDecorators,
  isStringLit,
  rocketToken,
} from "@/helpers/tsHelpers";
import { getVuexNamespace, registerDecorator } from "@/registry";
import {
  VxReferenceKind,
  VxResultKind,
  VxResultToComposable,
  VxTransform,
  VxTransformResult,
} from "@/types";
import ts, { isCallExpression } from "typescript";
import { instanceDependencies } from "../../utils/instancePropertyAccess";
import { isValidVuexDecoratorArg } from "./isValidVuexDecoratorArg";
import { namespacedStoreKey } from "./namespacedStoreKey";
import { VuexPropertyTypeBase } from "./vuexClass.types";

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
    let propExpr: ts.PropertyAccessExpression | undefined;
    const decoratorExpr = decorator.expression;

    if (isCallExpression(decoratorExpr)) {
      decoratorArgs = decoratorExpr.arguments[0];

      if (ts.isPropertyAccessExpression(decoratorExpr.expression)) {
        propExpr = decoratorExpr.expression;
      }
    } else if (ts.isPropertyAccessExpression(decoratorExpr)) {
      propExpr = decoratorExpr;
    }

    let namespace: ts.Identifier | ts.StringLiteral | undefined;
    if (
      propExpr &&
      (ts.isIdentifier(propExpr.expression) || ts.isStringLiteral(propExpr.expression))
    ) {
      namespace = getVuexNamespace(propExpr.expression.text);
    }

    const key = decoratorArgs ?? methodName;
    if (!isValidVuexDecoratorArg(key)) throw new Error("Invalid decorator @Action argument");
    const storeKeyName = getStoreKeyName(key, namespace) ?? key;
    const value = createArrowFn(methodName, storeKeyName, storeProperty, isAsync, node.type);
    const constStatement = createConstStatement(methodName, value);
    copySyntheticComments(constStatement, node);

    if (!node.type || !ts.isFunctionTypeNode(node.type)) {
      addTodoComment(constStatement, `Check function ${storeProperty} call signature.`);
    }

    const getDependency = instanceDependencies.get("$store");
    if (!getDependency) throw new Error("[vuex-class] $store dependency not found");
    const storeComposable = getDependency() as VxResultToComposable;
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

function getStoreKeyName(
  baseKey: VuexPropertyTypeBase,
  namespace?: ts.Identifier | ts.StringLiteral,
) {
  if (!namespace) {
    if (typeof baseKey !== "string" && (ts.isIdentifier(baseKey) || ts.isStringLiteral(baseKey))) {
    }
    // @Action foo: () => string; -> store.dispatch('foo');
    // @Action('foo/bar') foo: () => string; -> store.dispatch('foo/bar');
    // @Action('foo/' + bar) foo: () => string; -> store.dispatch('foo/' + bar);
    // @Action(someVar) foo: () => string; -> store.dispatch(someVar)
    return typeof baseKey === "string" ? ts.factory.createStringLiteral(baseKey) : baseKey;
  }

  if (typeof baseKey === "string" || ts.isStringLiteral(baseKey)) {
    // const ns1 = namespace('moduleB');
    // @ns1.Action() foo: string; -> 'moduleB/foo'
    // const ns2 = namespace(moduleC);
    // @ns2.Action() foo: string; -> `${moduleC}/foo`
    // @ns2.Action('foo/bar') foo: string; -> `${moduleC}/foo/bar`
    const prop = isStringLit(baseKey) ? baseKey : ts.factory.createStringLiteral(baseKey);
    const nsProp = namespacedStoreKey(namespace, prop);
    return nsProp;
  }

  if (ts.isBinaryExpression(baseKey)) {
    // const ns = namespace('moduleB');
    // @ns.Action('foo/' + bar) foo: () => string; -> ERROR
    throw new Error("Mixing namespace and binary expressions is not supported");
  }

  // const ns1 = namespace('moduleB');
  // @ns1.Action(someVar) foo: string; -> store.dispatch(`moduleB/${someVar}`);
  // const ns2 = namespace(moduleC);
  // @ns2.Getter(someVar) foo: string; -> store.dispatch(`${moduleC}/${someVar}`)
  const nsProp = namespacedStoreKey(namespace, baseKey);
  return nsProp;
}

function createArrowFn(
  methodName: string,
  storeKeyName: ts.Expression,
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
    const args = [storeKeyName];
    params = nodeType.parameters;
    let payloadName: string | undefined;
    if (params.length === 1) {
      payloadName = params[0].name.getText();
      args.push(createIdentifier(payloadName));
    } else if (params.length > 1) {
      throw new Error(
        `[vuex-class] ${methodName} ${storeProperty} signature has more than 1 parameter.`,
      );
    }

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

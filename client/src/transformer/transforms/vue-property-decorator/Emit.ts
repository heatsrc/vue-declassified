import {
  createArrowFunction,
  createConstStatement,
  createIdentifier,
  createPropertyAccess,
  getDecorators,
  isStringLit,
} from "@/helpers/tsHelpers.js";
import { registerDecorator } from "@/registry.js";
import { VxReferenceKind, VxResultKind, VxResultToMacro, VxTransform } from "@/types.js";
import ts, { TupleTypeNode } from "typescript";
import { instanceDependencies } from "../utils/instancePropertyAccess.js";
import { tryToFindType } from "../utils/tryToFindType.js";

const DECORATOR = "Emit";

// Code copied from Vue/src/shared/util.js
const pattern = /\B([A-Z])/g;
const hyphenate = (str: string) => str.replace(pattern, "-$1").toLowerCase();

export const transformEmitDecorator: VxTransform<ts.MethodDeclaration> = (node, program) => {
  if (!ts.isMethodDeclaration(node)) return { shouldContinue: true };

  const emitFnName = node.name.getText();
  const decorators = getDecorators(node, DECORATOR);

  if (!decorators || decorators.length <= 0) return { shouldContinue: true };
  if (decorators.length > 1)
    throw new Error(
      `[vue-property-decorator] Multiple @${DECORATOR} decorators found on ${emitFnName}`,
    );

  const decorator = decorators[0];

  if (!ts.isCallExpression(decorator.expression))
    throw new Error(`[vue-property-decorator] Expected @${DECORATOR} to be a call expression`);

  const decoratorArgs = decorator.expression.arguments;
  const eventName = isStringLit(decoratorArgs?.[0]) ? decoratorArgs[0].text : emitFnName;

  registerDecorator(DECORATOR);

  const methodParams = node.parameters ?? [];
  const methodParamNames = methodParams
    ? methodParams.map((p) => createIdentifier(p.name.getText()))
    : [];

  let retVal: ts.Expression | undefined;
  const returnValueId = createIdentifier("returnVal");
  const originalBodyStatements = node.body ? node.body.statements.map((s) => s) : [];
  let bodyStatements = originalBodyStatements.reduce((acc, curr) => {
    if (!ts.isReturnStatement(curr)) {
      acc.push(curr);
      return acc;
    }

    retVal = curr.expression;
    const returnVal = createConstStatement(returnValueId, retVal);
    const emitExpression = createEmit(eventName, [returnValueId, ...methodParamNames]);
    const returnStatement = ts.factory.createReturnStatement(returnValueId);

    acc.push(returnVal, emitExpression, returnStatement);

    return acc;
  }, [] as ts.Statement[]);

  if (bodyStatements.length <= 0) {
    bodyStatements = [...originalBodyStatements, createEmit(eventName, methodParamNames)];
  }

  const args = [...methodParams, ...(retVal ? [retVal] : [])];
  const tupleArgs = args.reduce((acc, arg) => {
    const name = ts.isParameter(arg) ? arg.name.getText() : returnValueId.text;
    const tupleType = tryToFindType(arg, program);
    const tupleElement = ts.factory.createNamedTupleMember(
      undefined,
      createIdentifier(name),
      undefined,
      tupleType,
    );
    acc.push(tupleElement);

    return acc;
  }, [] as ts.NamedTupleMember[]);
  const tupleLiteral = ts.factory.createTupleTypeNode(tupleArgs);
  const typeProperty: [propId: string, type: TupleTypeNode] = [eventName, tupleLiteral];

  const arrowFunction = createArrowFunction(node, bodyStatements, true);
  const constStatement = createConstStatement(emitFnName, arrowFunction);

  const getDependency = instanceDependencies.get("$emit");
  if (!getDependency) throw new Error("[vue-class-component] $emit dependency not found");
  const defineEmitsResult = getDependency() as VxResultToMacro;
  defineEmitsResult.typeProperties.push(typeProperty);

  return {
    shouldContinue: false,
    result: [
      defineEmitsResult,
      {
        tag: "EmitMethod",
        kind: VxResultKind.COMPOSITION,
        reference: VxReferenceKind.VARIABLE,
        imports: [],
        outputVariables: [emitFnName],
        nodes: [constStatement],
      },
    ],
  };
};

function createEmit(event: string, args: ts.Expression[]) {
  const eventName = ts.factory.createStringLiteral(hyphenate(event));
  const emit = createPropertyAccess(ts.factory.createThis(), "$emit");
  const callExpression = ts.factory.createCallExpression(emit, undefined, [eventName, ...args]);
  const emitExpression = ts.factory.createExpressionStatement(callExpression);
  return emitExpression;
}

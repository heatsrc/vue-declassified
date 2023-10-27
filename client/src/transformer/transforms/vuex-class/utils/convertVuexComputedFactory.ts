import { copySyntheticComments } from "@/helpers/comments";
import { createConstStatement, createIdentifier, getDecorators } from "@/helpers/tsHelpers";
import { namedImports } from "@/helpers/utils";
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

export type AccessExpressionGetter = (
  property: string | ts.Expression,
  namespace?: ts.Identifier | ts.StringLiteral,
) => ts.ElementAccessExpression | ts.PropertyAccessExpression;

export function convertVuexComputedFactory(
  decoratorName: "State" | "Getter",
  getAccessExpression: AccessExpressionGetter,
): VxTransform<ts.PropertyDeclaration> {
  return (node) => {
    const decorators = getDecorators(node, decoratorName);
    const computedName = (node.name as ts.Identifier).text;

    if (!decorators || decorators.length <= 0) return { shouldContinue: true };
    if (decorators.length > 1)
      throw new Error(`[vuex-class] Duplicate @${decoratorName} decorators for ${computedName}`);

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

    const typeArgs = node.type ? [node.type] : [];
    let arrowFunction: ts.ArrowFunction;

    const path = decoratorArgs ?? computedName;

    const accessExpr = getAccessExpression(path, namespace);
    arrowFunction = createSimpleArrowFunction(accessExpr);

    const computedCallExpr = ts.factory.createCallExpression(
      createIdentifier("computed"),
      typeArgs,
      [arrowFunction],
    );
    const constStatement = createConstStatement(computedName, computedCallExpr);
    const computedStatement = copySyntheticComments(constStatement, node);

    const getDependency = instanceDependencies.get("$store");
    if (!getDependency) throw new Error("[vuex-class] $store dependency not found");
    const storeComposable = getDependency() as VxResultToComposable;
    return {
      shouldContinue: false,
      result: [
        storeComposable,
        {
          kind: VxResultKind.COMPOSITION,
          reference: VxReferenceKind.VARIABLE_VALUE,
          imports: namedImports(["computed"], "vue"),
          outputVariables: [computedName],
          nodes: [computedStatement],
          tag: `VuexComputed-${decoratorName}`,
        } as VxTransformResult<ts.VariableStatement>,
      ],
    };
  };
}

export type VuexPropertyTypeBase = string | ts.Identifier | ts.StringLiteral | ts.BinaryExpression;

function createSimpleArrowFunction(returnValueExpr: ts.Expression) {
  const u = undefined;
  const arrowFunction = ts.factory.createArrowFunction(u, u, [], u, u, returnValueExpr);
  return arrowFunction;
}

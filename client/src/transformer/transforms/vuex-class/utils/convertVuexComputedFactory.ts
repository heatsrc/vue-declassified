import { copySyntheticComments } from "@/helpers/comments";
import {
  createConstStatement,
  createIdentifier,
  getDecorators,
  isArrowFunc,
} from "@/helpers/tsHelpers";
import { namedImports } from "@/helpers/utils";
import { registerDecorator } from "@/transformer/registry";
import {
  VxReferenceKind,
  VxResultKind,
  VxResultToComposable,
  VxTransform,
  VxTransformResult,
} from "@/types";
import { cloneNode } from "ts-clone-node";
import ts, { isCallExpression } from "typescript";
import { instanceDependencies } from "../../utils/instancePropertyAccess";
import { isValidIdentifier } from "../../utils/isValidIdentifier";

export function convertVuexComputedFactory(
  decoratorName: "State" | "Getter",
  storeProperty: "state" | "getters",
): VxTransform<ts.PropertyDeclaration> {
  return (node) => {
    const decorators = getDecorators(node, decoratorName);
    const computedName = node.name.getText();

    if (!decorators || decorators.length <= 0) return { shouldContinue: true };
    if (decorators.length > 1)
      throw new Error(`[vuex-class] Duplicate @${decoratorName} decorators for ${computedName}`);

    registerDecorator(decoratorName);

    const decorator = decorators[0];
    let decoratorArgs: ts.Expression | undefined;
    if (isCallExpression(decorator.expression)) {
      decoratorArgs = decorator.expression.arguments[0];
    }

    const typeArgs = node.type ? [node.type] : [];
    let arrowFunction: ts.ArrowFunction;

    const path = decoratorArgs ?? computedName;

    const accessExpr = getAccessExpression(path, storeProperty);
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

/**
 * Converts the decorator id to an arrow function with an access expression
 * @param property
 *
 * @example
 * \@State("foo") bar: string; -> (): string => store.state.foo
 * \@Getter("ns/foo") bar: boolean; -> (): boolean => store.getters["ns/foo"]
 */
function getAccessExpression(property: string | ts.Expression, storeProperty: "state" | "getters") {
  // @State(s => s.foo.bar) bar: string; -> store.state.foo.bar
  if (isArrowFunc(property)) {
    const transformer = getArrowFnTransformer(property, storeProperty);
    const transformedArrowFn = ts.transform(property, [transformer]).transformed[0];
    const accessExpr = cloneNode(transformedArrowFn.body) as ts.PropertyAccessExpression;
    return accessExpr;
  }

  const storeId = createIdentifier("store");
  const storePropertyId = createIdentifier(storeProperty);
  const accessExpr = ts.factory.createPropertyAccessExpression(storeId, storePropertyId);

  if (typeof property === "string") {
    if (!isValidIdentifier(property)) {
      // @State('ns/foo') bar: string; -> store.state['ns/foo']
      const propertyId = ts.factory.createStringLiteral(property);
      return ts.factory.createElementAccessExpression(accessExpr, propertyId);
    }

    // @State('foo') bar: string; -> store.state.foo
    const propertyId = createIdentifier(property);
    return ts.factory.createPropertyAccessExpression(accessExpr, propertyId);
  }

  // @Getter(someVar) foo: string; -> store.getters[someVar]
  return ts.factory.createElementAccessExpression(accessExpr, property);
}

function createSimpleArrowFunction(returnValueExpr: ts.Expression) {
  const u = undefined;
  const arrowFunction = ts.factory.createArrowFunction(u, u, [], u, u, returnValueExpr);
  return arrowFunction;
}

/**
 * Takes an arrow function, visits each node of the PropertyAccessExpression
 * until it files the arrow function parameter identifier and replaces it with
 * the store.<propertyName>
 *
 * TODO this currently only supports a concise body, I don't wanna deal with more complex bodies
 *
 * @example
 * (s) => s.foo.bar; // -> store.state.foo.bar
 */
function getArrowFnTransformer(arrowFn: ts.ArrowFunction, propertyName: "state" | "getters") {
  const [param] = arrowFn.parameters;
  if (!param) throw new Error("Expected an arrow function with a single parameter");
  const propertyId = createIdentifier(propertyName);
  const storeId = createIdentifier("store");
  const storeStateAccess = ts.factory.createPropertyAccessExpression(storeId, propertyId);

  return ((ctx) => {
    const visitor = (node: ts.Node): ts.Node => {
      if (ts.isIdentifier(node) && node.getText() === param.name.getText()) {
        return storeStateAccess;
      }
      return ts.visitEachChild(node, visitor, ctx);
    };

    return (node) => ts.visitNode(arrowFn, visitor);
  }) as ts.TransformerFactory<ts.ArrowFunction>;
}

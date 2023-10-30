import { createIdentifier, isArrowFunc } from "@/helpers/tsHelpers";
import { cloneNode } from "ts-clone-node";
import ts from "typescript";
import { isValidIdentifier } from "../utils/isValidIdentifier";
import { convertVuexComputedFactory } from "./utils/convertVuexComputedFactory";
import { VuexStatePropertyType } from "./utils/vuexClass.types";

export const transformVuexState = convertVuexComputedFactory("State", getAccessExpression);

/**
 * Converts the decorator id to an arrow function with an access expression
 * @param property
 *
 * ```ts
 * ⁣@State("foo") bar: string; -> (): string => store.state.foo
 * ⁣@Getter("ns/foo") bar: boolean; -> (): boolean => store.getters["ns/foo"]
 * ```
 */
function getAccessExpression(
  property: string | ts.Expression,
  namespace?: ts.Identifier | ts.StringLiteral,
) {
  if (
    typeof property !== "string" &&
    !ts.isIdentifier(property) &&
    !ts.isStringLiteral(property) &&
    !ts.isPropertyAccessExpression(property) &&
    !ts.isBinaryExpression(property) &&
    !isArrowFunc(property)
  ) {
    throw new Error(
      `[vuex-class] Unexpected decorator argument, expected String or Identifier or Arrow Function got ${
        ts.SyntaxKind[property.kind]
      }`,
    );
  }
  return getStateAccessExpression(property, namespace);
}

function getStateAccessExpression(
  property: VuexStatePropertyType,
  namespace?: ts.StringLiteral | ts.Identifier,
) {
  const propIsVar =
    typeof property !== "string" &&
    (ts.isIdentifier(property) || ts.isPropertyAccessExpression(property));
  // @State(s => s.foo.bar) bar: string; -> store.state.foo.bar
  // const ns = namespace('myNamespace');
  // @ns.State(s => s.foo.bar) bar: string; -> store.state.myNamespace.foo.bar
  // const ns = namespace(nsVar);
  // @ns.State(s => s.foo.bar) bar: string; -> store.state[nsVar].foo.bar
  if (isArrowFunc(property)) {
    const transformer = getArrowFnTransformer(property, namespace);
    const transformedArrowFn = ts.transform(property, [transformer]).transformed[0];
    const accessExpr = cloneNode(transformedArrowFn.body) as ts.PropertyAccessExpression;
    return accessExpr;
  }

  const storeId = createIdentifier("store");
  const storePropId = createIdentifier("state");
  const storePropAcs = ts.factory.createPropertyAccessExpression(storeId, storePropId);

  if (typeof property !== "string" && (propIsVar || ts.isBinaryExpression(property))) {
    // @State(someVar) foo: string; -> store.state[someVar]
    if (!namespace) return ts.factory.createElementAccessExpression(storePropAcs, property);

    let storeStateNsAsc: ts.AccessExpression | undefined;
    // const ns = namespace('moduleB');
    // @ns.State(someVar) foo: string; -> store.state.moduleB[someVar]
    if (ts.isStringLiteral(namespace)) {
      const nsId = createIdentifier(namespace.text);
      storeStateNsAsc = ts.factory.createPropertyAccessExpression(storePropAcs, nsId);
    } else {
      // const ns = namespace(moduleC);
      // @ns.State(someVar) foo: string; -> store.state[moduleC][someVar]
      storeStateNsAsc = ts.factory.createElementAccessExpression(storePropAcs, namespace);
    }
    return ts.factory.createElementAccessExpression(storeStateNsAsc, property);
  }

  let prop = typeof property !== "string" ? property.text : property;

  if (!isValidIdentifier(prop)) {
    // @State('ns/foo') bar: string; -> store.state['ns/foo']
    if (namespace) throw new Error("Mixing namespace and binary expressions is not supported");
    const propertyId = ts.factory.createStringLiteral(prop);
    return ts.factory.createElementAccessExpression(storePropAcs, propertyId);
  }

  // @State('foo') bar: string; -> store.state.foo
  const propertyId = createIdentifier(prop);
  if (!namespace) return ts.factory.createPropertyAccessExpression(storePropAcs, propertyId);
  // const ns = namespace('moduleB');
  // @ns.State('foo') bar: string; -> store.state.moduleB.foo
  if (ts.isStringLiteral(namespace)) {
    const nsId = createIdentifier(namespace.text);
    const storePropNsAcs = ts.factory.createPropertyAccessExpression(storePropAcs, nsId);
    return ts.factory.createPropertyAccessExpression(storePropNsAcs, propertyId);
  }
  // const ns = namespace(moduleC);
  // @ns.State('foo') bar: string; -> store.state[moduleC].foo
  const storePropNsAcs = ts.factory.createElementAccessExpression(storePropAcs, namespace);
  return ts.factory.createPropertyAccessExpression(storePropNsAcs, propertyId);
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
function getArrowFnTransformer(
  arrowFn: ts.ArrowFunction,
  namespace?: ts.Identifier | ts.StringLiteral,
) {
  const [param] = arrowFn.parameters;
  if (!param) throw new Error("Expected an arrow function with a single parameter");
  const storeId = createIdentifier("store");
  const propertyId = createIdentifier("state");
  let storeStateAccess: ts.AccessExpression = ts.factory.createPropertyAccessExpression(
    storeId,
    propertyId,
  );

  if (namespace) {
    if (ts.isStringLiteral(namespace)) {
      storeStateAccess = ts.factory.createPropertyAccessExpression(
        storeStateAccess,
        namespace.text,
      );
    } else {
      storeStateAccess = ts.factory.createElementAccessExpression(storeStateAccess, namespace);
    }
  }

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

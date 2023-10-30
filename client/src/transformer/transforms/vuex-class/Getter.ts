import { createIdentifier, isStringLit } from "@/helpers/tsHelpers";
import ts from "typescript";
import { isValidIdentifier } from "../utils/isValidIdentifier";
import { convertVuexComputedFactory } from "./utils/convertVuexComputedFactory";
import { namespacedStoreKey } from "./utils/namespacedStoreKey";
import { VuexPropertyTypeBase } from "./utils/vuexClass.types";

export const transformVuexGetter = convertVuexComputedFactory("Getter", getAccessExpression);

function getAccessExpression(
  property: string | ts.Expression,
  namespace?: ts.Identifier | ts.StringLiteral,
) {
  if (
    typeof property !== "string" &&
    !ts.isIdentifier(property) &&
    !ts.isStringLiteral(property) &&
    !ts.isPropertyAccessExpression(property) &&
    !ts.isBinaryExpression(property)
  ) {
    throw new Error(
      `[vuex-class] Unexpected decorator argument, expected String or Identifier got ${
        ts.SyntaxKind[property.kind]
      }`,
    );
  }
  return getGetterAccessExpression(property, namespace);
}

function getGetterAccessExpression(
  property: VuexPropertyTypeBase,
  namespace?: ts.StringLiteral | ts.Identifier,
) {
  const storeId = createIdentifier("store");
  const storePropertyId = createIdentifier("getters");
  const storeGetterAcs = ts.factory.createPropertyAccessExpression(storeId, storePropertyId);

  if (!namespace) {
    // Kind of feel like this is a perfect use case for a switch(true) statement
    // but TS doesn't type narrow them yet

    // @Getter foo: string; -> store.getters.foo
    if (typeof property === "string") {
      return ts.factory.createPropertyAccessExpression(storeGetterAcs, property);
    }

    // @Getter('foo/' + bar) foo: string; -> store.getters['foo/' + bar]
    if (ts.isBinaryExpression(property)) {
      return ts.factory.createElementAccessExpression(storeGetterAcs, property);
    }

    // @Getter(someVar) foo: string; -> store.getters[someVar]
    // @Getter(ns.getters.someVar) foo: string; -> store.getters[ns.getters.someVar]
    if (ts.isIdentifier(property) || ts.isPropertyAccessExpression(property))
      return ts.factory.createElementAccessExpression(storeGetterAcs, property);

    // @Getter foo: string; -> store.getters.foo
    if (isValidIdentifier(property.text)) {
      return ts.factory.createPropertyAccessExpression(storeGetterAcs, property.text);
    }

    // @Getter('foo/bar') foo: string; -> store.getters['foo/bar']
    return ts.factory.createElementAccessExpression(storeGetterAcs, property);
  }

  if (typeof property === "string" || ts.isStringLiteral(property)) {
    // const ns1 = namespace('moduleB');
    // @ns1.Getter foo: string; -> store.getters['moduleB/foo']
    // @ns1.Getter('foo/bar') foo: string; -> store.getters['moduleB/foo/bar']
    // const ns2 = namespace(moduleC);
    // @ns2.Getter foo: string; -> store.getters[`${moduleC}/foo`]
    // @ns2.Getter('foo/bar') foo: string; -> store.getters[`${moduleC}/foo/bar`]
    const prop = isStringLit(property) ? property : ts.factory.createStringLiteral(property);
    const nsProp = namespacedStoreKey(namespace, prop);
    return ts.factory.createElementAccessExpression(storeGetterAcs, nsProp);
  }

  if (ts.isBinaryExpression(property)) {
    // const ns = namespace('moduleB');
    // @ns.Getter('foo/' + bar) foo: string; -> ERROR
    throw new Error("Mixing namespace and binary expressions is not supported");
  }

  // const ns1 = namespace('moduleB');
  // @ns1.Getter(someVar) foo: string; -> store.getters[`moduleB/${someVar}`]
  // const ns2 = namespace(moduleC);
  // @ns2.Getter(someVar) foo: string; -> store.getters[`${moduleC}/${someVar}`]
  const nsProp = namespacedStoreKey(namespace, property);
  return ts.factory.createElementAccessExpression(storeGetterAcs, nsProp);
}

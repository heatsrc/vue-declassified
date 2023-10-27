import { createIdentifier, isStringLit } from "@/helpers/tsHelpers";
import ts from "typescript";
import { isValidIdentifier } from "../utils/isValidIdentifier";
import {
  VuexPropertyTypeBase,
  convertVuexComputedFactory,
} from "./utils/convertVuexComputedFactory";

export const transformVuexGetter = convertVuexComputedFactory("Getter", getAccessExpression);

/**
 * - `string` indicates that the class property name is being used as the store property name
 * ```ts
 *    ⁣@Getter() foo: boolean; // string : 'foo'
 * ```
 * - `Identifier` indicates that a variable has been passed as a parameter to the decorator
 * ```ts
 *    ⁣@Getter(bar) foo: boolean; // Identifier : bar
 * ```
 * - `StringLiteral` indicates that a string has been passed as a parameter to the decorator
 * ```ts
 *    ⁣@Getter('bar') foo: boolean; // StringLiteral : 'bar'
 * ```
 * - `BinaryExpression` indicates that a string concatenation has been passed as a parameter to the decorator
 * ```ts
 *    ⁣@Getter('foo/' + bar) foo: boolean; // BinaryExpression : 'foo/' + bar
 * ```
 */
type VuexGetterPropertyType = VuexPropertyTypeBase;

function getAccessExpression(
  property: string | ts.Expression,
  namespace?: ts.Identifier | ts.StringLiteral,
) {
  if (
    typeof property !== "string" &&
    !ts.isIdentifier(property) &&
    !ts.isStringLiteral(property) &&
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
  property: VuexGetterPropertyType,
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

    // @Getter(if (namespace) someVar) foo: string; -> store.getters[someVar]
    if (ts.isIdentifier(property))
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
    const nsProp = namespacedGetterProperty(namespace, prop);
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
  const nsProp = namespacedGetterProperty(namespace, property);
  return ts.factory.createElementAccessExpression(storeGetterAcs, nsProp);
}

function namespacedGetterProperty(
  namespace: ts.Identifier | ts.StringLiteral,
  property: ts.Identifier | ts.StringLiteral,
) {
  if (ts.isStringLiteral(namespace) && ts.isStringLiteral(property)) {
    // -> "moduleB/foo"
    return ts.factory.createStringLiteral(namespace.text + "/" + property.text);
  }

  if (ts.isStringLiteral(namespace) && ts.isIdentifier(property)) {
    // -> `moduleB/${foo}`
    const templateHead = ts.factory.createTemplateHead(namespace.text + "/");
    const templateSpan = ts.factory.createTemplateSpan(property, ts.factory.createTemplateTail(""));
    return ts.factory.createTemplateExpression(templateHead, [templateSpan]);
  }

  if (ts.isIdentifier(namespace) && ts.isIdentifier(property)) {
    // -> `${moduleB}/${foo}`
    const templateHead = ts.factory.createTemplateHead("");
    const namespaceSpan = ts.factory.createTemplateSpan(
      namespace,
      ts.factory.createTemplateMiddle("/"),
    );
    const templateSpan = ts.factory.createTemplateSpan(property, ts.factory.createTemplateTail(""));
    return ts.factory.createTemplateExpression(templateHead, [namespaceSpan, templateSpan]);
  }

  // -> `${moduleB}/foo`
  const templateHeaded = ts.factory.createTemplateHead("");
  const namespaceSpan = ts.factory.createTemplateSpan(
    namespace,
    ts.factory.createTemplateTail(`/${property.text}`),
  );
  return ts.factory.createTemplateExpression(templateHeaded, [namespaceSpan]);
}

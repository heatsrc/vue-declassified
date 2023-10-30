import ts from "typescript";

export function namespacedStoreKey(
  namespace: ts.Identifier | ts.StringLiteral,
  property: ts.Identifier | ts.StringLiteral | ts.PropertyAccessExpression,
) {
  const propIsVar = (prop: ts.Node): prop is ts.Identifier | ts.PropertyAccessExpression =>
    ts.isIdentifier(prop) || ts.isPropertyAccessExpression(prop);

  if (ts.isStringLiteral(namespace) && ts.isStringLiteral(property)) {
    // -> "moduleB/foo"
    return ts.factory.createStringLiteral(namespace.text + "/" + property.text);
  }

  if (propIsVar(property)) {
    if (ts.isStringLiteral(namespace)) {
      // -> `moduleB/${foo}`
      const templateHead = ts.factory.createTemplateHead(namespace.text + "/");
      const templateSpan = ts.factory.createTemplateSpan(
        property,
        ts.factory.createTemplateTail(""),
      );
      return ts.factory.createTemplateExpression(templateHead, [templateSpan]);
    }

    if (ts.isIdentifier(namespace)) {
      // -> `${moduleB}/${foo}`
      const templateHead = ts.factory.createTemplateHead("");
      const namespaceSpan = ts.factory.createTemplateSpan(
        namespace,
        ts.factory.createTemplateMiddle("/"),
      );
      const templateSpan = ts.factory.createTemplateSpan(
        property,
        ts.factory.createTemplateTail(""),
      );
      return ts.factory.createTemplateExpression(templateHead, [namespaceSpan, templateSpan]);
    }

    // This should be unreachable
    throw new Error(`Unexpected store namespace type.`);
  }

  // -> `${moduleB}/foo`
  const templateHeaded = ts.factory.createTemplateHead("");
  const namespaceSpan = ts.factory.createTemplateSpan(
    namespace,
    ts.factory.createTemplateTail(`/${property.text}`),
  );
  return ts.factory.createTemplateExpression(templateHeaded, [namespaceSpan]);
}

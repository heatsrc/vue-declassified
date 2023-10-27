import ts from "typescript";

export function namespacedStoreKey(
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

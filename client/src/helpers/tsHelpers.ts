import ts from "typescript";

export function getDecoratorNames(node: ts.Node) {
  if (!ts.canHaveDecorators(node)) return [];

  const decorators = ts.getDecorators(node) ?? [];
  return decorators.map((decorator) =>
    ts.isCallExpression(decorator.expression)
      ? decorator.expression.expression.getText()
      : decorator.expression.getText(),
  );
}

export function getPackageName(node: ts.Node) {
  if (!ts.isImportDeclaration(node)) return undefined;

  const moduleSpecifier = node.moduleSpecifier;
  if (!ts.isStringLiteral(moduleSpecifier)) return undefined;

  return moduleSpecifier.text;
}

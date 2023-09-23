import ts, { factory } from "typescript";

const u = undefined;
export function getPropertyDeclaration(varName: string, value: ts.Expression, type?: ts.TypeNode) {
  const property = factory.createPropertyDeclaration(
    u,
    factory.createIdentifier(varName),
    u,
    type,
    value,
  );
  const classDeclaration = factory.createClassDeclaration(
    u,
    factory.createIdentifier("foo"),
    u,
    u,
    [property],
  );
  return { property, classDeclaration };
}

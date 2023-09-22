import ts from "typescript";
import { VxTransformResult, VxImportClause, VxResultKind } from "../types.js";

export function getImports(results: VxTransformResult<ts.Node>[]) {
  const importMap = new Map<string, VxImportClause>();

  results.forEach((r) => {
    r.imports.forEach((i) => {
      const key = "external" in i ? i.external : i.path;
      const clause: VxImportClause = importMap.get(key) ?? { named: new Set() };

      if (!("default" in clause) && "default" in i) clause.default = i.default;
      i.named?.forEach((name) => clause.named.add(name));
      importMap.set(key, clause);
    });
  });

  return [...importMap].map((el) => {
    const [key, clause] = el;
    const name = clause.default ? ts.factory.createIdentifier(clause.default) : undefined;
    const importElements = [...clause.named].map((named) =>
      ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(named)),
    );
    const namedImports = ts.factory.createNamedImports(importElements);

    return ts.factory.createImportDeclaration(
      undefined,
      ts.factory.createImportClause(false, name, namedImports),
      ts.factory.createStringLiteral(key),
    );
  });
}

export function getBody(results: VxTransformResult<ts.Node>[]) {
  return results
    .filter((el) => el.kind === VxResultKind.COMPOSITION)
    .map((el) => el.nodes)
    .reduce((acc, el) => acc.concat(el), []) as ts.Statement[];
}

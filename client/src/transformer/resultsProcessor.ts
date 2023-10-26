import Debug from "debug";
import ts from "typescript";
import {
  VxImportClause,
  VxTransformResult,
  isComposableType,
  isCompositionType,
  isMacroType,
} from "../types.js";

const debug = Debug("vuedc:transformer:resultsProcessor");

export function getImports(
  results: VxTransformResult<ts.Node>[],
  outsideImports: ts.ImportDeclaration[] = [],
) {
  debug("Collating imports");
  const importMap = new Map<string, VxImportClause>();

  outsideImports.forEach((imp) => {
    const clause: VxImportClause = { named: new Set() };
    const name = imp.importClause?.name?.text;
    if (name) clause.default = name;
    imp.importClause?.namedBindings?.forEachChild((el) => {
      if (ts.isImportSpecifier(el)) clause.named.add(el.name.text);
    });
    importMap.set((imp.moduleSpecifier as ts.StringLiteral).text, clause);
  });

  results.forEach(({ imports }) => {
    imports.forEach((i) => {
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
    const namedImports =
      importElements.length > 0 ? ts.factory.createNamedImports(importElements) : undefined;

    debug(`Creating import declaration for: ${key}`);
    return ts.factory.createImportDeclaration(
      undefined,
      ts.factory.createImportClause(false, name, namedImports),
      ts.factory.createStringLiteral(key),
    );
  });
}

export function getBody(results: VxTransformResult<ts.Node>[]) {
  debug("Collating body");
  return results.filter(isCompositionType).flatMap((el) => el.nodes);
}

export function getMacros(results: VxTransformResult<ts.Node>[]) {
  debug("Collating Macros");
  return results.filter(isMacroType).flatMap((el) => el.nodes);
}

export function getComposables(results: VxTransformResult<ts.Node>[]) {
  debug("Collating Composables");
  return results.filter(isComposableType).flatMap((el) => el.nodes);
}

import ts from "typescript";
import { detectNamingCollisions } from "./helpers/collisionDetection.js";
import { prependSyntheticComments } from "./helpers/comments.js";
import { classTransforms } from "./transformer/config.js";
import { getBody, getComposables, getImports, getMacros } from "./transformer/resultsProcessor.js";
import { processClassDecorator, processClassMember } from "./transformer/statementsProcessor.js";
import { VxTransformResult } from "./types.js";

export function runTransforms(
  node: ts.ClassDeclaration,
  outsideStatements: ts.Statement[],
  program: ts.Program,
) {
  const results = getAstResults(node, program);

  const outsideImports = outsideStatements.filter((s) =>
    ts.isImportDeclaration(s),
  ) as ts.ImportDeclaration[];
  const outsideStatementsWithoutImports = outsideStatements.filter(
    (s) => !ts.isImportDeclaration(s),
  );
  const imports = getImports(results, outsideImports);
  const macros = getMacros(results);
  const composables = getComposables(results);
  const body = getBody(results);

  prependSyntheticComments(imports[0], node);

  return [
    ...imports,
    ...outsideStatementsWithoutImports,
    ...macros,
    ...composables,
    ...body,
  ] as ts.Statement[];
}

function getAstResults(node: ts.ClassDeclaration, program: ts.Program) {
  let results: VxTransformResult<ts.Node>[] = [];

  node.forEachChild((child) => {
    if (ts.isDecorator(child)) {
      const res = processClassDecorator(child, program);
      if (res) results.push(...res);
    } else if (child.kind in classTransforms) {
      const member = processClassMember(child, program);
      if (member) results.push(...member);
    }
  });

  for (const postProcessor of classTransforms.after) {
    results = postProcessor(results, program);
  }

  detectNamingCollisions(results);

  return results;
}

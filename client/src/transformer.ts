import ts from "typescript";
import { prependSyntheticComments } from "./helpers/comments.js";
import { VxTransformResult } from "./types.js";
import { classTransforms } from "./transformer/config.js";
import { getBody, getImports } from "./transformer/resultsProcessor.js";
import { processClassDecorator, processClassMember } from "./transformer/statementsProcessor.js";

export function runTransforms(node: ts.ClassDeclaration, program: ts.Program) {
  const results = getAstResults(node, program);

  const imports = getImports(results);
  // const macros = getMacros(results);
  // const composables = getComposables(results);

  prependSyntheticComments(imports[0], node);

  return [
    ...imports,
    //...macros,
    //...composables,
    ...getBody(results),
  ];
}

function getAstResults(node: ts.ClassDeclaration, program: ts.Program) {
  let results: VxTransformResult<ts.Node>[] = [];

  node.forEachChild((child) => {
    let res: VxTransformResult<ts.Node>[] | false = false;
    if (ts.isDecorator(child)) {
      res = processClassDecorator(child, program);
    } else if (child.kind in classTransforms) {
      res = processClassMember(child, program);
    }
    if (!res) return;
    results.push(...res);
  });

  for (const postProcessor of classTransforms.after) {
    results = postProcessor(results, program);
  }

  return results;
}

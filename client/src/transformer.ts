import ts from "typescript";
import { addTodoComment, prependSyntheticComments } from "./helpers/comments.js";
import { classTransforms } from "./transformer/config.js";
import { getBody, getComposables, getImports, getMacros } from "./transformer/resultsProcessor.js";
import { processClassDecorator, processClassMember } from "./transformer/statementsProcessor.js";
import { instancePropertyKeyMap } from "./transformer/transforms/utils/instancePropertyAccess.js";
import { VxTransformResult } from "./types.js";

export function runTransforms(
  node: ts.ClassDeclaration,
  existingImports: ts.Identifier[],
  program: ts.Program,
) {
  const { results, collisions } = getAstResults(node, existingImports, program);

  const imports = getImports(results);
  const macros = getMacros(results);
  const composables = getComposables(results);
  const body = getBody(results);

  prependSyntheticComments(imports[0], node);
  if (collisions) addTodoComment(macros[0], collisions, true);

  return [...imports, ...macros, ...composables, ...body] as ts.Statement[];
}

function getAstResults(
  node: ts.ClassDeclaration,
  existingImports: ts.Identifier[],
  program: ts.Program,
) {
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

  const collisions = detectNamingCollisions(results, existingImports);

  return { results, collisions };
}

function detectNamingCollisions(results: VxTransformResult<ts.Node>[], imports: ts.Identifier[]) {
  const names = new Set<string>();
  const collisions = new Map<string, Set<string>>();

  results.forEach((result) => {
    result.outputVariables.forEach((name) => {
      const sources = collisions.get(name) ?? new Set();
      if (names.has(name) && !instancePropertyKeyMap.has(`$${name}`)) {
        sources.add("Other variables");
        collisions.set(name, sources);
      }
      if (imports.find((i) => i.text === name)) {
        sources.add("External imports");
        collisions.set(name, sources);
      }
      names.add(name);
    });
  });

  if (collisions.size > 0) {
    const c = [...collisions.entries()].reduce((acc, [name, sources]) => {
      acc += `\n   - \`${name}\` is defined in: ${[...sources].join(", ")}`;
      return acc;
    }, "");
    return `Fix naming collisions\n ${c}\n\n   It is strongly suggested you fix these prior to\n   converting the file. Usage of these variables may\n   be ambiguous in the converted code.\n`;
  }
}

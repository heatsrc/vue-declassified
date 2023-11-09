import Debug from "debug";
import ts from "typescript";
import { detectNamingCollisions } from "./helpers/collisionDetection.js";
import { classTransforms } from "./transformer/config.js";
import { getBody, getComposables, getImports, getMacros } from "./transformer/resultsProcessor.js";
import { processClassDecorator, processClassMember } from "./transformer/statementsProcessor.js";
import { VxTransformResult } from "./types.js";

const debug = Debug("vuedc:transformer");

export function runTransforms(classNode: ts.ClassDeclaration, program: ts.Program) {
  debug("Running transforms");
  let results: VxTransformResult<ts.Node>[] = [];

  debug("Processing class component");
  classNode.forEachChild((child) => {
    if (ts.isDecorator(child)) {
      const res = processClassDecorator(child, program);
      if (res) results.push(...res);
    } else if (child.kind in classTransforms) {
      const member = processClassMember(child, program);
      if (member) results.push(...member);
    }
  });

  debug("Running post processors");
  for (const postProcessor of classTransforms.after) {
    results = postProcessor(results, program, classNode);
  }

  detectNamingCollisions(results);

  return results;
}

/**
 * Organize statements in SFC script block
 *
 * - Imports
 * - Misc. statements found outside default export class
 * - Macros
 * - Composables
 * - Primary body of code
 *
 * @param results
 * @param preamble
 * @returns
 */
export function organizeSfcScript(results: VxTransformResult<ts.Node>[], preamble: ts.Statement[]) {
  debug("Organizing statements in SFC script block");
  const outsideImports = preamble.filter((s): s is ts.ImportDeclaration =>
    ts.isImportDeclaration(s),
  );
  const preambleWithoutImports = preamble.filter((s) => !ts.isImportDeclaration(s));
  const imports = getImports(results, outsideImports);
  const macros = getMacros(results);
  const composables = getComposables(results);
  const body = getBody(results);

  const resultStatements = [
    ...imports,
    ...preambleWithoutImports,
    ...macros,
    ...composables,
    ...body,
  ] as ts.Statement[];

  // Group all imports at start
  return [
    ...resultStatements.filter((s) => ts.isImportDeclaration(s)),
    ...resultStatements.filter((s) => !ts.isImportDeclaration(s)),
  ];
}

export function organizeMixinFile(results: VxTransformResult<ts.Node>[], preamble: ts.Statement[]) {
  debug("Organizing statements in mixin file");
  const outsideImports = preamble.filter((s): s is ts.ImportDeclaration =>
    ts.isImportDeclaration(s),
  );
  const preambleWithoutImports = preamble.filter((s) => !ts.isImportDeclaration(s));
  const imports = getImports(results, outsideImports);
  const body = getBody(results);

  const resultStatements = [...imports, ...preambleWithoutImports, ...body] as ts.Statement[];
  return resultStatements;
}

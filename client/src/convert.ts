import getDebug from "debug";
import ts from "typescript";
import {
  filterUnwantedPreamble,
  getClassComponents,
  getDefaultExportNode,
  getPreamble,
  hasVccImports,
  registerImportNameOverrides,
} from "./convert/convertHelpers.js";
import { registerVuexNamespaces } from "./convert/vuexClassHelpers.js";
import { registerTopLevelVars } from "./helpers/collisionDetection.js";
import { organizeSfcScript, runTransforms } from "./transformer.js";

const debug = getDebug("vuedc:convert");

export function convertDefaultClassComponent(source: ts.SourceFile, program: ts.Program) {
  if (!hasVccImports(source)) throw new Error("No vue class component import found in this file");

  const defaultExport = getDefaultExportNode(source);
  if (!defaultExport) throw new Error("No default export found in this file");

  const preamble = handlePreamble(source);
  const results = runTransforms(defaultExport, program);
  const organizedScriptBody = organizeSfcScript(defaultExport, results, preamble);
  const result = updateSource(source, organizedScriptBody);

  return result;
}

export function convertMixinClassComponents(source: ts.SourceFile, program: ts.Program) {
  if (!hasVccImports(source)) throw new Error("No vue class component import found in this file");

  const classes = getClassComponents(source);
  if (!classes) throw new Error("No vue class components found in this file");

  const preamble = handlePreamble(source);

  const results = classes.map((cls) => {
    debug("Running transforms");
    let resultStatements = runTransforms(cls, program);

    // Group imports at start
    resultStatements = [
      ...resultStatements.filter((s) => ts.isImportDeclaration(s)),
      ...resultStatements.filter((s) => !ts.isImportDeclaration(s)),
    ];

    const result = updateSource(source, resultStatements);
    return result;
  });
}

function handlePreamble(source: ts.SourceFile) {
  const preamble = getPreamble(source);
  registerTopLevelVars(preamble);
  registerImportNameOverrides(preamble);
  registerVuexNamespaces(preamble);
  const filteredPreamble = filterUnwantedPreamble(preamble);
  return filteredPreamble;
}

function updateSource(source: ts.SourceFile, statements: ts.Statement[]) {
  debug("Updating source file");
  const printer = ts.createPrinter();
  const newSourceFile = ts.factory.updateSourceFile(source, statements);
  const result = printer.printFile(newSourceFile);
  return result;
}

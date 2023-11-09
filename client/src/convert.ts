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
import { prependSyntheticComments } from "./helpers/comments.js";
import { organizeMixinFile, organizeSfcScript, runTransforms } from "./transformer.js";
import { VxTransformResult } from "./types.js";

const debug = getDebug("vuedc:convert");

export function convertDefaultClassComponent(source: ts.SourceFile, program: ts.Program) {
  if (!hasVccImports(source)) throw new Error("No vue class component import found in this file");

  const defaultExport = getDefaultExportNode(source);
  if (!defaultExport) throw new Error("No default export found in this file");

  const preamble = handlePreamble(getPreamble(source));
  const results = runTransforms(defaultExport, program);
  const organizedScriptBody = organizeSfcScript(results, preamble);
  debug("Copy class comment to script block");
  prependSyntheticComments(organizedScriptBody[0], defaultExport);
  const result = updateSource(source, organizedScriptBody);

  return result;
}

export function convertMixinClassComponents(source: ts.SourceFile, program: ts.Program) {
  if (!hasVccImports(source)) throw new Error("No vue class component import found in this file");

  const classes = getClassComponents(source);
  if (!classes) throw new Error("No vue class components found in this file");

  const preamble = handlePreamble([...source.statements], false);

  const results = classes.reduce((acc, cls) => {
    if (!cls?.name) {
      debug("Class has no name, skipping");
      return acc;
    }

    debug(`Running transforms on ${cls.name.text}`);
    const resultStatements = runTransforms(cls, program);
    acc.push(...resultStatements);
    return acc;
  }, [] as VxTransformResult<ts.Node>[]);

  const organizedMixin = organizeMixinFile(results, preamble);

  const result = updateSource(source, organizedMixin);
  return result;
}

function handlePreamble(preamble: ts.Statement[], filter = true) {
  registerTopLevelVars(preamble);
  registerImportNameOverrides(preamble);
  registerVuexNamespaces(preamble);

  if (filter) return filterUnwantedPreamble(preamble);
  return preamble;
}

function updateSource(source: ts.SourceFile, statements: ts.Statement[]) {
  debug("Updating source file");
  const printer = ts.createPrinter();
  const newSourceFile = ts.factory.updateSourceFile(source, statements);
  const result = printer.printFile(newSourceFile);
  return result;
}

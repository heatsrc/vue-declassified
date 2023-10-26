import Debug from "debug";
import ts from "typescript";
import { registerTopLevelVars } from "./helpers/collisionDetection.js";
import { getDecoratorNames, getPackageName } from "./helpers/tsHelpers.js";
import { setImportNameOverride } from "./registry.js";
import { runTransforms } from "./transformer.js";

const debug = Debug("vuedc:convert");
const vccPackages = ["vue-class-component", "vue-property-decorator", "vuex-class"];

export function convertAst(source: ts.SourceFile, program: ts.Program) {
  if (!hasVccImports(source)) throw new Error("No vue class component import found in this file");

  const defaultExportNode = getDefaultExportNode(source);
  if (!defaultExportNode) throw new Error("No default export found in this file");

  const outsideStatements = getOutsideStatements(source);
  registerTopLevelVars(outsideStatements);
  registerImportNameOverrides(outsideStatements);

  const unwantedStatements = (s: ts.Statement) => {
    const pkg = getPackageName(s);
    if (pkg && vccPackages.includes(pkg)) return true;
    if (pkg === "vue") return true;
  };
  const filteredOutsideStatements = outsideStatements.filter((s) => !unwantedStatements(s));

  debug("Running transforms");
  let resultStatements = runTransforms(defaultExportNode, filteredOutsideStatements, program);

  // Group imports at start
  resultStatements = [
    ...resultStatements.filter((s) => ts.isImportDeclaration(s)),
    ...resultStatements.filter((s) => !ts.isImportDeclaration(s)),
  ];

  debug("Updating source file");
  const printer = ts.createPrinter();
  const newSourceFile = ts.factory.updateSourceFile(source, resultStatements);
  const result = printer.printFile(newSourceFile);
  return result;
}

function registerImportNameOverrides(statements: ts.Statement[]) {
  const imports = statements.filter((s): s is ts.ImportDeclaration => ts.isImportDeclaration(s));
  imports.forEach((imp) => {
    const importClause = imp.importClause;
    if (!importClause) return;
    if (!importClause.namedBindings) return;
    if (!ts.isNamedImports(importClause.namedBindings)) return;
    importClause.namedBindings.elements.forEach((el) => {
      if (!el.propertyName) return;
      setImportNameOverride(el.propertyName.text, el.name.text);
    });
  });
}
/**
 * Get's the statements outside of the default class export
 * @param source
 * @returns statements not belonging to the default class export
 */
function getOutsideStatements(source: ts.SourceFile) {
  debug("Getting statements outside of default export");
  const unwantedStatements = (s: ts.Statement) => ts.isClassDeclaration(s) && getDecoratorNames(s);
  return source.statements.map((el) => el).filter((el) => !unwantedStatements(el));
}

function hasVccImports(source: ts.SourceFile) {
  debug("Checking for vue class component imports");
  return source.statements.find((s) => {
    if (!ts.isImportDeclaration(s)) return false;
    if (!vccPackages.includes((s.moduleSpecifier as ts.StringLiteral).text)) return false;
    return true;
  });
}

function getDefaultExportNode(sourceFile: ts.SourceFile) {
  debug("Checking for default export");
  const classes = sourceFile.statements.filter((s): s is ts.ClassDeclaration =>
    ts.isClassDeclaration(s),
  );
  const defExport = classes.find(
    (c) => c.modifiers?.find((m) => m.kind === ts.SyntaxKind.DefaultKeyword),
  );

  if (!defExport) return;

  const decorators = getDecoratorNames(defExport);
  if (!decorators?.some((d) => /(Options|Component)/.test(d))) return;

  return defExport;
}

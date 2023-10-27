import Debug from "debug";
import ts from "typescript";
import { registerTopLevelVars } from "./helpers/collisionDetection.js";
import { getDecoratorNames, getPackageName } from "./helpers/tsHelpers.js";
import {
  getImportNameOverride,
  registerDecorator,
  setImportNameOverride,
  setVuexNamespace,
} from "./registry.js";
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
  registerVuexNamespaces(outsideStatements);

  const unwantedStatements = (s: ts.Statement) => {
    const pkg = getPackageName(s);
    if (pkg && vccPackages.includes(pkg)) return true;
    if (pkg === "vue") return true;
    if (getNamespaceStatement(s)) return true;
  };
  debug("Removing unwanted imports");
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

function registerVuexNamespaces(statements: ts.Statement[]) {
  statements.forEach((s) => {
    const ns = getNamespaceStatement(s);
    if (!ns) return;

    const namespace = ns.initializer.arguments[0];
    if (!namespace || (!ts.isStringLiteral(namespace) && !ts.isIdentifier(namespace))) return;
    setVuexNamespace(ns.name.text, namespace);
    registerDecorator(ns.name.text);
  });
}

function getNamespaceStatement(statement: ts.Statement) {
  const namespaceDecl = getImportNameOverride("namespace") ?? "namespace";
  if (!ts.isVariableStatement(statement)) return false;
  if (statement.declarationList.declarations.length !== 1) return false;
  const declaration = statement.declarationList.declarations[0];
  if (!ts.isIdentifier(declaration.name)) return false;
  if (!declaration.initializer || !ts.isCallExpression(declaration.initializer)) return false;
  const expr = declaration.initializer.expression;
  if (!ts.isIdentifier(expr)) return false;
  if (expr.text !== namespaceDecl) return false;
  return { name: declaration.name, initializer: declaration.initializer };
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

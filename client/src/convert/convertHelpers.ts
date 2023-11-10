import { getDecoratorNames, getPackageName } from "@/helpers/tsHelpers";
import { setImportNameOverride } from "@/registry";
import getDebug from "debug";
import ts from "typescript";
import { getNamespaceStatement } from "./vuexClassHelpers";

const debug = getDebug("vuedc:convert:convertHelpers");
const VCC_PACKAGES = ["vue-class-component", "vue-property-decorator", "vuex-class"];

/**
 * Registers import name overrides from the script block
 * @param statements
 */
export function registerImportNameOverrides(statements: ts.Statement[]) {
  const imports = statements.filter((s): s is ts.ImportDeclaration => ts.isImportDeclaration(s));
  imports.forEach((imp) => {
    const importClause = imp.importClause;
    if (!importClause) return;
    if (!importClause.namedBindings) return;
    if (!ts.isNamedImports(importClause.namedBindings)) return;
    importClause.namedBindings.elements.forEach((el) => {
      if (!el.propertyName) return;
      debug(`Setting import name override: ${el.propertyName.text} -> ${el.name.text}`);
      setImportNameOverride(el.propertyName.text, el.name.text);
    });
  });
}
/**
 * Gets the statements outside of the default class export
 * @param source
 * @returns statements not belonging to the default class export
 */
export function getPreamble(source: ts.SourceFile) {
  debug("Getting statements outside of default export");
  const unwantedStatements = (s: ts.Statement) => ts.isClassDeclaration(s) && getDecoratorNames(s);
  return source.statements.map((el) => el).filter((el) => !unwantedStatements(el));
}

/**
 * Checks if the source file has vue class component imports
 * @param source
 * @returns false if no vue class component imports found
 */
export function hasVccImports(source: ts.SourceFile) {
  debug("Checking for vue class component imports");
  return source.statements.find((s) => {
    if (!ts.isImportDeclaration(s)) return false;
    if (!VCC_PACKAGES.includes((s.moduleSpecifier as ts.StringLiteral).text)) return false;
    return true;
  });
}

/**
 * Gets the default export node
 * @param sourceFile
 * @returns default export node
 */
export function getDefaultExportNode(sourceFile: ts.SourceFile) {
  debug("Checking for default export");
  const classes = getClassComponents(sourceFile);
  const defaultKeywordKind = ts.SyntaxKind.DefaultKeyword;
  const defaultExport = (c: ts.ClassDeclaration) =>
    c.modifiers?.find((m) => m.kind === defaultKeywordKind);
  const defExport = classes.find(defaultExport);

  return defExport;
}

/**
 * Gets all class components in the source file
 * @param sourceFile
 * @returns all class components
 */
export function getClassComponents(sourceFile: ts.SourceFile) {
  debug("Finding all class components");
  const classes = sourceFile.statements
    .filter((s): s is ts.ClassDeclaration => ts.isClassDeclaration(s))
    .filter((c) => getDecoratorNames(c)?.some((d) => /(Options|Component)/.test(d)));

  return classes;
}

/**
 * Filters out unwanted imports and statements from the script block
 * @param preamble
 * @returns filtered script block statements
 */
export function filterUnwantedPreamble(preamble: ts.Statement[]) {
  const unwantedStatements = (s: ts.Statement) => {
    const pkg = getPackageName(s);
    if (pkg && VCC_PACKAGES.includes(pkg)) return true;
    if (pkg === "vue") return true;
    if (getNamespaceStatement(s)) return true;
  };
  debug("Removing unwanted imports and statements (e.g., vuex-class namespace)");
  const filteredPreamble = preamble.filter((s) => !unwantedStatements(s));
  return filteredPreamble;
}

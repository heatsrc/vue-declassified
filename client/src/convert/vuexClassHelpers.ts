import { getImportNameOverride, registerDecorator, setVuexNamespace } from "@/registry";
import getDebug from "debug";
import ts from "typescript";

const debug = getDebug("vuedc:convert:vuexClassHelpers");

/**
 * Checks vuex-class namespace statement from registered the import name,
 * decorator name, and namespace name
 * @param statements
 */
export function registerVuexNamespaces(statements: ts.Statement[]) {
  statements.forEach((s) => {
    const ns = getNamespaceStatement(s);
    if (!ns) return;

    const namespace = ns.initializer.arguments[0];
    if (!namespace || (!ts.isStringLiteral(namespace) && !ts.isIdentifier(namespace))) return;
    debug(`Setting vuex namespace for @${getImportNameOverride("namespace")}: ${namespace.text}`);
    setVuexNamespace(ns.name.text, namespace);
    registerDecorator(ns.name.text);
  });
}

/**
 * Finds the namespace statement in the script block and returns the variable
 * name and initializer
 * @param statement
 * @returns
 */
export function getNamespaceStatement(statement: ts.Statement) {
  const namespaceDecl = getImportNameOverride("namespace");
  if (!ts.isVariableStatement(statement)) return false;
  if (statement.declarationList.declarations.length !== 1) return false;
  const declaration = statement.declarationList.declarations[0];
  if (!ts.isIdentifier(declaration.name)) return false;
  if (!declaration.initializer || !ts.isCallExpression(declaration.initializer)) return false;
  const expr = declaration.initializer.expression;
  if (!ts.isIdentifier(expr)) return false;
  if (expr.text !== namespaceDecl) return false;
  debug(`Found vuex namespace statement: ${declaration.name.text}`);
  return { name: declaration.name, initializer: declaration.initializer };
}

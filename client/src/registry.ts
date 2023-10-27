import Debug from "debug";
import ts from "typescript";
const debug = Debug("vuedc:registry");
/**
 * Global registry singleton for file level metadata that can be useful
 */
class Registry {
  decorators = new Set<string>();
  variableNames = new Map<"imports" | "topLevel" | "classBody", Set<string>>([
    ["imports", new Set()],
    ["topLevel", new Set()],
    ["classBody", new Set()],
  ]);
  collisions = new Map<string, { tag: string; sources: Set<string> }>();
  importNameOverrides = new Map<string, string>();
  warnings = new Set<string>();
  vuexNamespacedDecorators = new Map<string, ts.StringLiteral | ts.Identifier>();
}
const registry = new Registry();

export function resetRegistry() {
  debug("Resetting registry");
  registry.decorators.clear();
  registry.variableNames.get("imports")!.clear();
  registry.variableNames.get("topLevel")!.clear();
  registry.variableNames.get("classBody")!.clear();
  registry.importNameOverrides.clear();
  registry.collisions.clear();
  registry.warnings.clear();
  registry.vuexNamespacedDecorators.clear();
}

export function isDecoratorRegistered(decorator: string) {
  return registry.decorators.has(decorator);
}

export function registerDecorator(decorator: string) {
  debug(`Registering decorator: ${decorator}`);
  registry.decorators.add(decorator);
}

export function registerTopLevelVariables(ids: string[], isImport = false) {
  debug(`Registering top level variables: ${ids.join(", ")}`);
  const topLevelIds = registry.variableNames.get(isImport ? "imports" : "topLevel")!;
  ids.forEach(topLevelIds.add, topLevelIds);
}

export function isTopLevelVariableRegistered(id: string) {
  return (
    registry.variableNames.get("imports")!.has(id) ||
    registry.variableNames.get("topLevel")!.has(id)
  );
}

export function registerClassBodyVariable(id: string) {
  debug(`Registering class body variable: ${id}`);
  registry.variableNames.get("classBody")!.add(id);
}

export function registeredVariableTypes(id: string) {
  debug(`Getting registered variable types: ${id}`);
  const registeredIn = [];
  if (registry.variableNames.get("imports")!.has(id)) registeredIn.push("import declarations");
  if (registry.variableNames.get("topLevel")!.has(id))
    registeredIn.push("top level variable declarations");
  return registeredIn;
}

export function hasClassBodyVariable(id: string) {
  return registry.variableNames.get("classBody")!.has(id);
}

export function hasCollisions() {
  return registry.collisions.size > 0;
}

export function hasCollision(varName: string) {
  return registry.collisions.has(varName);
}

export function addCollision(varName: string, tag: string, source: string) {
  debug(`Adding collision for: ${varName}`);
  const collision = registry.collisions.get(varName) ?? { tag, sources: new Set() };
  collision.sources.add(source);
  registry.collisions.set(varName, collision);
}

export function getCollisions() {
  return [...registry.collisions.entries()];
}

export function setImportNameOverride(importName: string, override: string) {
  debug(`Setting import name override: ${importName} -> ${override}`);
  registry.importNameOverrides.set(importName, override);
}

export function hasImportNameOverride(importName: string) {
  return registry.importNameOverrides.has(importName);
}

export function getImportNameOverride(importName: string) {
  debug(`Getting import name override: ${importName}`);
  return registry.importNameOverrides.get(importName);
}

export function addGlobalWarning(message: string) {
  debug(`Adding global warning: ${message}`);
  registry.warnings.add(message);
}

export function getGlobalWarnings() {
  return [...registry.warnings];
}

export function setVuexNamespace(decorator: string, namespace: ts.StringLiteral | ts.Identifier) {
  debug(`Setting vuex namespace for @${decorator}: ${namespace.text}`);
  registry.vuexNamespacedDecorators.set(decorator, namespace);
}

export function getVuexNamespace(decorator: string) {
  debug(`Getting vuex namespace for @${decorator}`);
  return registry.vuexNamespacedDecorators.get(decorator);
}

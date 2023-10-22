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
}
const registry = new Registry();

export function resetRegistry() {
  registry.decorators.clear();
  registry.variableNames.get("imports")!.clear();
  registry.variableNames.get("topLevel")!.clear();
  registry.variableNames.get("classBody")!.clear();
  registry.importNameOverrides.clear();
  registry.collisions.clear();
}

export function isDecoratorRegistered(decorator: string) {
  return registry.decorators.has(decorator);
}

export function registerDecorator(decorator: string) {
  registry.decorators.add(decorator);
}

export function registerTopLevelVariables(ids: string[], isImport = false) {
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
  registry.variableNames.get("classBody")!.add(id);
}

export function registeredVariableTypes(id: string) {
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
  const collision = registry.collisions.get(varName) ?? { tag, sources: new Set() };
  collision.sources.add(source);
  registry.collisions.set(varName, collision);
}

export function getCollisions() {
  return [...registry.collisions.entries()];
}

export function setImportNameOverride(importName: string, override: string) {
  registry.importNameOverrides.set(importName, override);
}

export function hasImportNameOverride(importName: string) {
  return registry.importNameOverrides.has(importName);
}

export function getImportNameOverride(importName: string) {
  return registry.importNameOverrides.get(importName);
}

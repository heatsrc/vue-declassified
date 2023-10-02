/**
 * Global registry singleton for file level metadata that can be useful
 */
class Registry {
  decorators = new Set<string>();
}
const registry = new Registry();

export function isDecoratorRegistered(decorator: string) {
  return registry.decorators.has(decorator);
}

export function registerDecorator(decorator: string) {
  registry.decorators.add(decorator);
}

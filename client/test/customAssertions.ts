/**
 * Chai assertions don't take advantage of TypeScript assertion functions so,
 * for example, if you check if something is defined it will not inform TS that
 * it is defined.
 *
 * ! If a way could be determined to use expect.extend to add these assertions
 * ! that would be ideal.
 */
import { expect } from "vitest";

export function shouldBeTypeOf<T>(val: unknown, type: string): asserts val is T {
  expect(typeof val).toBe(type);
}

export function shouldBeDefined(val: unknown): asserts val {
  expect(val).toBeDefined();
}

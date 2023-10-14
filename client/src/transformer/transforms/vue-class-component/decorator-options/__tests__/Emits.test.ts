import { convertAst } from "@/convert.js";
import { getSingleFileProgram } from "@/parser.js";
import { describe, expect, it } from "vitest";

describe("Emits", () => {
  it("should transform emits", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component } from 'vue-class-component';
      @Component({ emits: ['a', 'b', 'c'] })
      export default class Foo { }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "const emit = defineEmits<{
          \\"a\\": [
              ...args: unknown[]
          ];
          \\"b\\": [
              ...args: unknown[]
          ];
          \\"c\\": [
              ...args: unknown[]
          ];
      }>();
      "
    `);
  });

  it("should throw an error if the emits option is not an array", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component } from 'vue-class-component';
      @Component({ emits: 'a' })
      export default class Foo { }
    `);
    expect(() => convertAst(ast, program)).toThrowError(
      `[vue-class-component] emits option should be string[]`,
    );
  });
});

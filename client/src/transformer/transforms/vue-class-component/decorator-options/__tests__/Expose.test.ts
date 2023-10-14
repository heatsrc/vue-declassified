import { convertAst } from "@/convert.js";
import { getSingleFileProgram } from "@/parser.js";
import { describe, expect, it } from "vitest";

describe("Emits", () => {
  it("should transform expose option", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Options } from 'vue-class-component';
      @Options({ expose: ['a', 'b', 'c'] })
      export default class Foo {
        a: string = 'a';
        b: boolean = true;
        c: number = 1;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { ref } from \\"vue\\";
      const a = ref<string>(\\"a\\");
      const b = ref<boolean>(true);
      const c = ref<number>(1);
      defineExpose({ a, b, c });
      "
    `);
  });

  it("should throw an error if the expose option is not an array", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Options } from 'vue-class-component';
      @Options({ expose: 'a' })
      export default class Foo { }
    `);
    expect(() => convertAst(ast, program)).toThrowError(
      `[vue-class-component] expose option should be string[]`,
    );
  });

  it("should throw an error if the expose option elements are not string", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Options } from 'vue-class-component';
      @Options({ expose: [a] })
      export default class Foo { }
    `);
    expect(() => convertAst(ast, program)).toThrowError(
      `[vue-class-component] expose option should be string[]`,
    );
  });
});

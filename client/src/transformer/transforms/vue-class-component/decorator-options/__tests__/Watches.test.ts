import { convertDefaultClassComponent } from "@/convert";
import { getSingleFileProgram } from "@/parser";
import { describe, expect, it } from "vitest";

describe("@Component watches definition", () => {
  it("should transform simple key and function value", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Options } from 'vue-class-component';
      @Options({ watch: { a: function () {} } })
      export default class Foo {}
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { watch } from \\"vue\\";
      watch(a, function () { });
      "
    `);
  });

  it("should transform a key of nested properties", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Options } from 'vue-class-component';
      @Options({ watch: { 'a.b.c': function () {} } })
      export default class Foo {
        a: { b: { c: string } } = { b: { c: 'c' } };
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { reactive, watch } from \\"vue\\";
      const a = reactive<{
          b: {
              c: string;
          };
      }>({ b: { c: 'c' } });
      watch(() => a?.b?.c, function () { });
      "
    `);
  });

  it("should transform a key and string value", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Options } from 'vue-class-component';
      @Options({ watch: { a: 'getA' } })
      export default class Foo {
        a = {b: {c: true}};
        getA() {}
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { reactive, watch } from \\"vue\\";
      const a = reactive({ b: { c: true } });
      const getA = () => { };
      watch(a, getA);
      "
    `);
  });

  it("should transform a key and watch options", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Options } from 'vue-class-component';
      @Options({ watch: {
        a: { handler: function () {}, deep: true }
      } })
      export default class Foo {}
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { watch } from \\"vue\\";
      watch(a, function () { }, { deep: true });
      "
    `);
  });

  it("should transform a key with an array of watch options", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Options } from 'vue-class-component';
      @Options({ watch: {
        a: [
          { handler: function () {} },
          { handler: () => {}, deep: true },
          'getA',
        ]
      } })
      export default class Foo {
        a = {b: {c: true}};
        getA() {}
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { reactive, watch } from \\"vue\\";
      const a = reactive({ b: { c: true } });
      const getA = () => { };
      watch(a, function () { });
      watch(a, () => { }, { deep: true });
      watch(a, getA);
      "
    `);
  });

  it("should throw an error if the watch option is not an object", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Options } from 'vue-class-component';
      @Options({ watch: 'a' })
      export default class Foo {}
    `);
    expect(() => convertDefaultClassComponent(ast, program)).toThrowError(
      `[vue-class-component] watch option should be an object`,
    );
  });
});

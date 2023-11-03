import { convertDefaultClassComponent } from "@/convert";
import { getSingleFileProgram } from "@/parser";
import { describe, expect, it } from "vitest";

describe("Provide decorator", () => {
  it("should transform provide decorator using local name as provide name", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component, Provide} from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Provide()
        foo = 'bar';
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { ref, provide } from \\"vue\\";
      const foo = ref(\\"bar\\");
      provide(\\"foo\\", foo)
      "
    `);
  });

  it("should transform provide decorator using provide name", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component, Provide} from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Provide('foo')
        bar = 'baz';
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { ref, provide } from \\"vue\\";
      const bar = ref(\\"baz\\");
      provide('foo', bar)
      "
    `);
  });

  it("should throw if provide decorator is not a string literal", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component, Provide} from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Provide({ from: 'foo', default: 'bar' })
        bar = 'baz';
      }
    `);
    expect(() => convertDefaultClassComponent(ast, program)).toThrowError(
      `[vue-class-component] Expected @Provide to be a string literal`,
    );
  });

  it("should throw if duplicate provide decorator", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component, Provide} from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Provide('foo')
        @Provide('bar')
        baz = 'baz';
      }
    `);
    expect(() => convertDefaultClassComponent(ast, program)).toThrowError(
      `[vue-class-component] Duplicate @Provide decorators for baz`,
    );
  });
});

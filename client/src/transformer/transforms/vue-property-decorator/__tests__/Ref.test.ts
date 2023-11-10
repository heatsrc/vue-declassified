import { convertDefaultClassComponent } from "@/convert";
import { getSingleFileProgram } from "@/parser";
import { describe, expect, it } from "vitest";

describe("Ref decorator", () => {
  it("should transform ref decorator using local name as ref name", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component, Ref} from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Ref()
        foo: string;
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { ref } from \\"vue\\";
      const foo = ref<string>();
      "
    `);
  });

  it("should transform ref decorator using ref name", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component, Ref} from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Ref('foo')
        bar: string;
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { ref } from \\"vue\\";
      /* [VUEDC_TODO]: Update template, replace 'ref=\\"'foo'\\"' with 'ref=\\"bar\\"'*/ const bar = ref<string>();
      "
    `);
  });

  it("should throw if ref decorator is not a string literal", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component, Ref} from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Ref(1)
        bar: string;
      }
    `);
    expect(() => convertDefaultClassComponent(ast, program)).toThrowError(
      `[vue-property-decorator] Expected @Ref to be a string literal`,
    );
  });

  it("should throw if duplicate ref decorator", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component, Ref} from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Ref()
        @Ref()
        bar: string;
      }
    `);
    expect(() => convertDefaultClassComponent(ast, program)).toThrowError(
      `[vue-property-decorator] Duplicate @Ref decorators for bar`,
    );
  });
});

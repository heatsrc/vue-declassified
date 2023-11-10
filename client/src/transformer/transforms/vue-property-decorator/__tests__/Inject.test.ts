import { convertDefaultClassComponent } from "@/convert";
import { getSingleFileProgram } from "@/parser";
import { describe, expect, it } from "vitest";

describe("Inject decorator", () => {
  it("should transform inject decorator using local name as inject name", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Inject } from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Inject()
        foo: string;
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { inject } from \\"vue\\";
      const foo = inject<string>(\\"foo\\");
      "
    `);
  });

  it("should transform inject decorator using inject name", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Inject } from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Inject('foo')
        bar: string;
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { inject } from \\"vue\\";
      const bar = inject<string>(\\"foo\\");
      "
    `);
  });

  it("should transform inject decorator using inject name and default value", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Inject } from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Inject({ from: 'foo', default: 'bar' })
        bar: string;
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { inject } from \\"vue\\";
      const bar = inject<string>(\\"foo\\", \\"bar\\");
      "
    `);
  });

  it("should transform inject decorator using inject name and object literal default value", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Inject } from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Inject({ from: 'foo', default: () => ({ bar: 'baz' }) })
        bar: { bar: string };
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { inject } from \\"vue\\";
      const bar = inject<{
          bar: string;
      }>(\\"foo\\", () => ({ bar: \\"baz\\" }));
      "
    `);
  });

  it("should transform inject decorator using inject name and array literal default value", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Inject } from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Inject({ from: 'foo', default: () => [1, 2, 3] })
        bar: number[];
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { inject } from \\"vue\\";
      const bar = inject<number[]>(\\"foo\\", () => [1, 2, 3]);
      "
    `);
  });

  it("should transform inject decorator using inject name from variable", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Inject } from 'vue-property-decorator';
      const foo = 'foo';
      @Component
      export default class Foo {
        @Inject(foo)
        bar: string;
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { inject } from \\"vue\\";
      const foo = 'foo';
      const bar = inject<string>(foo);
      "
    `);
  });

  it("should throw error when using inject decorator with multiple decorators", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Inject, Prop } from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Inject()
        @Inject()
        foo: string;
      }
    `);
    expect(() => convertDefaultClassComponent(ast, program)).toThrowError(
      `[vue-property-decorator] Duplicate @Inject decorators for foo`,
    );
  });
});

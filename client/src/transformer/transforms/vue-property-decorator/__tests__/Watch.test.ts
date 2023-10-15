import { convertAst } from "@/convert";
import { getSingleFileProgram } from "@/parser";
import { describe, expect, it } from "vitest";

describe("Watch decorator", () => {
  it("should transform watch decorator", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component, Watch} from 'vue-property-decorator';
      @Component
      export default class Foo {
        foo = 'bar';

        @Watch('foo')
        bar() {}
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { ref } from \\"vue\\";
      const foo = ref(\\"bar\\");
      const bar = () => { };
      watch(foo, bar);
      "
    `);
  });

  it("should support multiple watch decorators", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component, Watch} from 'vue-property-decorator';
      @Component
      export default class Foo {
        foo = 'bar';
        bar = 'qux';

        @Watch('foo')
        @Watch('bar')
        baz() {}
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { ref } from \\"vue\\";
      const foo = ref(\\"bar\\");
      const bar = ref(\\"qux\\");
      const baz = () => { };
      watch(foo, baz);
      watch(bar, baz);
      "
    `);
  });

  it("should support watch options", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component, Watch} from 'vue-property-decorator';
      @Component
      export default class Foo {
        foo = 'bar';

        @Watch('foo', { immediate: true, deep: true })
        bar() {}
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { ref } from \\"vue\\";
      const foo = ref(\\"bar\\");
      const bar = () => { };
      watch(foo, bar, { immediate: true, deep: true });
      "
    `);
  });

  it("should throw if decorator is not a call expression", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component, Watch} from 'vue-property-decorator';
      @Component
      export default class Foo {
        foo = 'bar';

        @Watch
        bar() {}
      }
    `);
    expect(() => convertAst(ast, program)).toThrowError(
      `[vue-property-decorator] Expected @Watch for bar to be a call expression`,
    );
  });

  it("should throw if watch decorator is not a string literal", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component, Watch} from 'vue-property-decorator';
      @Component
      export default class Foo {
        foo = 'bar';

        @Watch({ from: 'foo', default: 'bar' })
        bar() {}
      }
    `);
    expect(() => convertAst(ast, program)).toThrowError(
      `[vue-property-decorator] Expected @Watch for bar to be called with a string as first argument`,
    );
  });
});

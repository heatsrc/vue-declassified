import { convertAst } from "@/convert";
import { getSingleFileProgram } from "@/parser";
import { describe, expect, it } from "vitest";

describe("Action decorator", () => {
  it("should transform action decorator", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Action} from 'vuex-class';
      @Component
      export default class Foo {
        @Action foo: () => void;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const store = useStore();
      const foo = async (): Promise<void> => store.dispatch(\\"foo\\");
      "
    `);
  });

  it("should transform action decorator with action name", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Action} from 'vuex-class';
      @Component
      export default class Foo {
        @Action('bar') foo: () => void;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const store = useStore();
      const foo = async (): Promise<void> => store.dispatch('bar');
      "
    `);
  });

  it("should transform action decorator with action name and namespace", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Action} from 'vuex-class';
      @Component
      export default class Foo {
        @Action('baz/foo') foo: () => void;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const store = useStore();
      const foo = async (): Promise<void> => store.dispatch('baz/foo');
      "
    `);
  });

  it("should transform action decorator return type", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Action} from 'vuex-class';
      @Component
      export default class Foo {
        @Action('baz/foo') foo: () => string;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const store = useStore();
      const foo = async (): Promise<string> => store.dispatch('baz/foo');
      "
    `);
  });

  it("should transform action decorator with variable action name", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Action} from 'vuex-class';
      const foo = 'foo';
      @Component
      export default class Foo {
        @Action(foo) bar: (a: string) => void;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const foo = 'foo';
      const store = useStore();
      const bar = async (a: string): Promise<void> => store.dispatch(foo, a);
      "
    `);
  });

  it("should add todo if function signature is missing", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Action} from 'vuex-class';
      @Component
      export default class Foo {
        @Action foo;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const store = useStore();
      /* [VUEDC_TODO]: Check function dispatch call signature.*/ const foo = async (...args: unknown[]): Promise<unknown> => store.dispatch(\\"foo\\", args);
      "
    `);
  });

  it("should throw if duplicate action decorator", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Action} from 'vuex-class';
      @Component
      export default class Foo {
        @Action @Action foo: () => void;
      }
    `);
    expect(() => convertAst(ast, program)).toThrowError(
      "[vuex-class] Duplicate @Action decorators for foo",
    );
  });

  it("should throw if function signature contains more than 1 parameter", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Action} from 'vuex-class';
      @Component
      export default class Foo {
        @Action foo: (a: string, b: string) => void;
      }
    `);
    expect(() => convertAst(ast, program)).toThrowError(
      "[vuex-class] foo dispatch signature has more than 1 parameter.",
    );
  });
});

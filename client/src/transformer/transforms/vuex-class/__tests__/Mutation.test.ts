import { convertAst } from "@/convert";
import { getSingleFileProgram } from "@/parser";
import { describe, expect, it } from "vitest";

describe("Mutation decorator", () => {
  it("should transform mutation decorator", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Mutation} from 'vuex-class';
      @Component
      export default class Foo {
        @Mutation foo: () => void;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const store = useStore();
      const foo = (): void => store.commit(\\"foo\\");
      "
    `);
  });

  it("should transform mutation decorator with mutation name", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Mutation} from 'vuex-class';
      @Component
      export default class Foo {
        @Mutation('bar') foo: () => void;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const store = useStore();
      const foo = (): void => store.commit('bar');
      "
    `);
  });

  it("should transform mutation decorator with mutation name and namespace", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Mutation} from 'vuex-class';
      @Component
      export default class Foo {
        @Mutation('baz/foo') foo: () => void;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const store = useStore();
      const foo = (): void => store.commit('baz/foo');
      "
    `);
  });

  it("should transform mutation decorator return type", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Mutation} from 'vuex-class';
      @Component
      export default class Foo {
        // This is bad practice, mutations should not return anything
        @Mutation('baz/foo') foo: () => string;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const store = useStore();
      // This is bad practice, mutations should not return anything
      const foo = (): string => store.commit('baz/foo');
      "
    `);
  });

  it("should transform mutation decorator with variable mutation name", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Mutation} from 'vuex-class';
      const foo = 'foo';
      @Component
      export default class Foo {
        @Mutation(foo) bar: (a: string) => void;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const foo = 'foo';
      const store = useStore();
      const bar = (a: string): void => store.commit(foo, a);
      "
    `);
  });

  it("should add todo if function signature is missing", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Mutation} from 'vuex-class';
      @Component
      export default class Foo {
        @Mutation foo;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const store = useStore();
      /* [VUEDC_TODO]: Check function commit call signature.*/ const foo = (...args: unknown[]): unknown => store.commit(\\"foo\\", args);
      "
    `);
  });

  it("should throw if duplicate mutation decorator", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Mutation} from 'vuex-class';
      @Component
      export default class Foo {
        @Mutation @Mutation foo: () => void;
      }
    `);
    expect(() => convertAst(ast, program)).toThrowError(
      "[vuex-class] Duplicate @Mutation decorators for foo",
    );
  });

  it("should throw if function signature contains more than 1 parameter", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Mutation} from 'vuex-class';
      @Component
      export default class Foo {
        @Mutation foo: (a: string, b: string) => void;
      }
    `);
    expect(() => convertAst(ast, program)).toThrowError(
      "[vuex-class] foo commit signature has more than 1 parameter.",
    );
  });
});

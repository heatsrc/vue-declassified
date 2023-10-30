import { convertAst } from "@/convert";
import { getSingleFileProgram } from "@/parser";
import { describe, expect, it } from "vitest";

describe("Mutation decorator", () => {
  it("should transform mutation decorator", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Mutation} from 'vuex-class';
      const ns1 = namespace('moduleB');
      const moduleC = 'moduleC';
      const ns2 = namespace(moduleC);
      @Component
      export default class Foo {
        @Mutation foo: () => void;
        @ns1.Mutation baz: () => void;
        @ns2.Mutation qux: () => void;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const moduleC = 'moduleC';
      const store = useStore();
      const foo = (): void => store.commit(\\"foo\\");
      const baz = (): void => store.commit(\\"moduleB/baz\\");
      const qux = (): void => store.commit(\`\${moduleC}/qux\`);
      "
    `);
  });

  it("should transform mutation decorator with mutation name", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Mutation} from 'vuex-class';
      const ns1 = namespace('moduleB');
      const moduleC = 'moduleC';
      const ns2 = namespace(moduleC);
      @Component
      export default class Foo {
        @Mutation('bar') foo: () => void;
        @ns1.Mutation('bar') baz: () => void;
        @ns2.Mutation('bar') qux: () => void;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const moduleC = 'moduleC';
      const store = useStore();
      const foo = (): void => store.commit('bar');
      const baz = (): void => store.commit(\\"moduleB/bar\\");
      const qux = (): void => store.commit(\`\${moduleC}/bar\`);
      "
    `);
  });

  it("should transform mutation decorator with mutation name and namespace", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Mutation} from 'vuex-class';
      const ns1 = namespace('moduleB');
      const moduleC = 'moduleC';
      const ns2 = namespace(moduleC);
      @Component
      export default class Foo {
        @Mutation('baz/foo') foo: () => void;
        @ns1.Mutation('baz/foo') baz: () => void;
        @ns2.Mutation('baz/foo') qux: () => void;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const moduleC = 'moduleC';
      const store = useStore();
      const foo = (): void => store.commit('baz/foo');
      const baz = (): void => store.commit(\\"moduleB/baz/foo\\");
      const qux = (): void => store.commit(\`\${moduleC}/baz/foo\`);
      "
    `);
  });

  it("should transform mutation decorator return type", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Mutation} from 'vuex-class';
      const ns1 = namespace('moduleB');
      const moduleC = 'moduleC';
      const ns2 = namespace(moduleC);
      @Component
      export default class Foo {
        // This is bad practice, mutations should not return anything
        @Mutation('baz/foo') foo: () => string;
        @ns1.Mutation('baz/foo') baz: () => string;
        @ns2.Mutation('baz/foo') qux: () => string;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const moduleC = 'moduleC';
      const store = useStore();
      // This is bad practice, mutations should not return anything
      const foo = (): string => store.commit('baz/foo');
      const baz = (): string => store.commit(\\"moduleB/baz/foo\\");
      const qux = (): string => store.commit(\`\${moduleC}/baz/foo\`);
      "
    `);
  });

  it("should transform mutation decorator with variable mutation name", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Mutation} from 'vuex-class';
      const ns1 = namespace('moduleB');
      const moduleC = 'moduleC';
      const ns2 = namespace(moduleC);
      const foo = 'foo';
      const keys = { mutations: { foo: 'foo' } };
      @Component
      export default class Foo {
        @Mutation(foo) bar: (a: string) => void;
        @ns1.Mutation(foo) baz: (a: string) => void;
        @ns2.Mutation(foo) qux: (a: string) => void;
        @Mutation(keys.mutations.foo) voluptatum: (a: string) => void;
        @ns1.Mutation(keys.mutations.foo) qui: (a: string) => void;
        @ns2.Mutation(keys.mutations.foo) impedit: (a: string) => void;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const moduleC = 'moduleC';
      const foo = 'foo';
      const keys = { mutations: { foo: 'foo' } };
      const store = useStore();
      const bar = (a: string): void => store.commit(foo, a);
      const baz = (a: string): void => store.commit(\`moduleB/\${foo}\`, a);
      const qux = (a: string): void => store.commit(\`\${moduleC}/\${foo}\`, a);
      const voluptatum = (a: string): void => store.commit(keys.mutations.foo, a);
      const qui = (a: string): void => store.commit(\`moduleB/\${keys.mutations.foo}\`, a);
      const impedit = (a: string): void => store.commit(\`\${moduleC}/\${keys.mutations.foo}\`, a);
      "
    `);
  });

  it("should add todo if function signature is missing", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Mutation} from 'vuex-class';
      const ns1 = namespace('moduleB');
      const moduleC = 'moduleC';
      const ns2 = namespace(moduleC);
      @Component
      export default class Foo {
        @Mutation foo;
        @ns1.Mutation baz;
        @ns2.Mutation qux;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      const moduleC = 'moduleC';
      const store = useStore();
      /* [VUEDC_TODO]: Check function commit call signature.*/ const foo = (...args: unknown[]): unknown => store.commit(\\"foo\\", args);
      /* [VUEDC_TODO]: Check function commit call signature.*/ const baz = (...args: unknown[]): unknown => store.commit(\\"moduleB/baz\\", args);
      /* [VUEDC_TODO]: Check function commit call signature.*/ const qux = (...args: unknown[]): unknown => store.commit(\`\${moduleC}/qux\`, args);
      "
    `);
  });

  it.each(["", "ns1.", "ns2."])("should throw if duplicate mutation decorator", (prefix) => {
    const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Mutation} from 'vuex-class';
      const ns1 = namespace('moduleB');
      const moduleC = 'moduleC';
      const ns2 = namespace(moduleC);
      @Component
      export default class Foo {
        @${prefix}Mutation @${prefix}Mutation foo: () => void;
      }
    `);
    expect(() => convertAst(ast, program)).toThrowError(
      "[vuex-class] Duplicate @Mutation decorators for foo",
    );
  });

  it.each(["", "ns1.", "ns2."])(
    "should throw if function signature contains more than 1 parameter",
    (prefix) => {
      const { ast, program } = getSingleFileProgram(`
      import {Component} from 'vue-property-decorator';
      import {Mutation} from 'vuex-class';
      const ns1 = namespace('moduleB');
      const moduleC = 'moduleC';
      const ns2 = namespace(moduleC);
      @Component
      export default class Foo {
        @${prefix}Mutation foo: (a: string, b: string) => void;
      }
    `);
      expect(() => convertAst(ast, program)).toThrowError(
        "[vuex-class] foo commit signature has more than 1 parameter.",
      );
    },
  );
});

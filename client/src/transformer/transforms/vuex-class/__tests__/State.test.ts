import { convertAst } from "@/convert";
import { getSingleFileProgram } from "@/parser";
import { describe, expect, it } from "vitest";

describe("State decorator", () => {
  it("should transform state", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Vue } from 'vue-property-decorator';
      import { State, namespace } from 'vuex-class';
      const ns1 = namespace('moduleB');
      const moduleC = 'moduleC';
      const ns2 = namespace(moduleC);
      @Component
      export default class Foo {
        @State bar: string;
        @ns1.State baz: string;
        @ns2.State qux: string;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      import { computed } from \\"vue\\";
      const moduleC = 'moduleC';
      const store = useStore();
      const bar = computed<string>(() => store.state.bar);
      const baz = computed<string>(() => store.state.moduleB.baz);
      const qux = computed<string>(() => store.state[moduleC].qux);
      "
    `);
  });

  it("should transform state with string property argument", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Vue } from 'vue-property-decorator';
      import { State } from 'vuex-class';
      const ns1 = namespace('moduleB');
      const moduleC = 'moduleC';
      const ns2 = namespace(moduleC);
      @Component
      export default class Foo {
        @State('foo') bar: string;
        @ns1.State('foo') baz: string;
        @ns2.State('foo') qux: string;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      import { computed } from \\"vue\\";
      const moduleC = 'moduleC';
      const store = useStore();
      const bar = computed<string>(() => store.state.foo);
      const baz = computed<string>(() => store.state.moduleB.foo);
      const qux = computed<string>(() => store.state[moduleC].foo);
      "
    `);
  });

  it("should transform state with variable property argument", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Vue } from 'vue-property-decorator';
      import { State } from 'vuex-class';
      const ns1 = namespace('moduleB');
      const moduleC = 'moduleC';
      const ns2 = namespace(moduleC);
      const foo = 'foo';
      @Component
      export default class Foo {
        @State(foo) bar: string;
        @ns1.State(foo) baz: string;
        @ns2.State(foo) qux: string;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      import { computed } from \\"vue\\";
      const moduleC = 'moduleC';
      const foo = 'foo';
      const store = useStore();
      const bar = computed<string>(() => store.state[foo]);
      const baz = computed<string>(() => store.state.moduleB[foo]);
      const qux = computed<string>(() => store.state[moduleC][foo]);
      "
    `);
  });

  it("should transform state with namespaced string property argument", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Vue } from 'vue-property-decorator';
      import { State } from 'vuex-class';
      @Component
      export default class Foo {
        @State('ns/foo') bar: string;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      import { computed } from \\"vue\\";
      const store = useStore();
      const bar = computed<string>(() => store.state[\\"ns/foo\\"]);
      "
    `);
  });

  it("should transform state with namespaces string property argument concatenated with variable", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Vue } from 'vue-property-decorator';
      import { State } from 'vuex-class';
      const foo = 'foo';
      @Component
      export default class Foo {
        @State('ns/' + foo) bar: () => string;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      import { computed } from \\"vue\\";
      const foo = 'foo';
      const store = useStore();
      const bar = computed<() => string>(() => store.state['ns/' + foo]);
      "
    `);
  });

  it("should transform state with callback as decorator argument", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Vue } from 'vue-property-decorator';
      import { State, namespace } from 'vuex-class';
      const ns1 = namespace('moduleB');
      const moduleC = 'moduleC';
      const ns2 = namespace(moduleC);
      @Component
      export default class Foo {
        @State(s => s.foo.bar) bar: string;
        @ns1.State(s => s.foo.bar) baz: string;
        @ns2.State(s => s.foo.bar) qux: string;
      }
    `);

    const result = convertAst(ast, program);
    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      import { computed } from \\"vue\\";
      const moduleC = 'moduleC';
      const store = useStore();
      const bar = computed<string>(() => store.state.foo.bar);
      const baz = computed<string>(() => store.state.moduleB.foo.bar);
      const qux = computed<string>(() => store.state[moduleC].foo.bar);
      "
    `);
  });

  it("should throw when there are duplicate decorators", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Vue } from 'vue-property-decorator';
      import { State } from 'vuex-class';
      @Component
      export default class Foo {
        @State @State foo: string;
      }
    `);
    expect(() => convertAst(ast, program)).toThrowError(
      "[vuex-class] Duplicate @State decorators for foo",
    );
  });

  it("should throw when there are duplicate namespaced decorators", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Vue } from 'vue-property-decorator';
      import { State, namespace } from 'vuex-class';
      const ns = namespace('moduleB');
      @Component
      export default class Foo {
        @ns.State @ns.State foo: string;
      }
    `);
    expect(() => convertAst(ast, program)).toThrowError(
      "[vuex-class] Duplicate @State decorators for foo",
    );
  });
});

import { convertDefaultClassComponent } from "@/convert";
import { getSingleFileProgram } from "@/parser";
import { describe, expect, it } from "vitest";

describe("Getter decorator", () => {
  it("should transform getter", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Vue } from 'vue-property-decorator';
      import { Getter, namespace } from 'vuex-class';
      const ns1 = namespace('moduleB');
      const moduleC = 'moduleC';
      const ns2 = namespace(moduleC);
      @Component
      export default class Foo {
        @Getter bar: string;
        @ns1.Getter baz: string;
        @ns2.Getter qux: string;
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      import { computed } from \\"vue\\";
      const moduleC = 'moduleC';
      const store = useStore();
      const bar = computed<string>(() => store.getters.bar);
      const baz = computed<string>(() => store.getters[\\"moduleB/baz\\"]);
      const qux = computed<string>(() => store.getters[\`\${moduleC}/qux\`]);
      "
    `);
  });

  it("should transform getter with string property argument", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Vue } from 'vue-property-decorator';
      import { State } from 'vuex-class';
      const ns1 = namespace('moduleB');
      const moduleC = 'moduleC';
      const ns2 = namespace(moduleC);
      @Component
      export default class Foo {
        @Getter('foo') bar: string;
        @ns1.Getter('foo') baz: string;
        @ns2.Getter('foo') qux: string;
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      import { computed } from \\"vue\\";
      const moduleC = 'moduleC';
      const store = useStore();
      const bar = computed<string>(() => store.getters.foo);
      const baz = computed<string>(() => store.getters[\\"moduleB/foo\\"]);
      const qux = computed<string>(() => store.getters[\`\${moduleC}/foo\`]);
      "
    `);
  });

  it("should transform getter with variable property argument", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Vue } from 'vue-property-decorator';
      import { State, namespace } from 'vuex-class';
      const ns1 = namespace('moduleB');
      const moduleC = 'moduleC';
      const ns2 = namespace(moduleC);
      const foo = 'foo';
      const storeKeys = { getters: { foo: 'foo' } };
      @Component
      export default class Foo {
        @Getter(foo) bar: string;
        @ns1.Getter(foo) baz: string;
        @ns2.Getter(foo) qux: string;
        @Getter(storeKeys.getters.foo) harum: string;
        @ns1.Getter(storeKeys.getters.foo) ipsa: string;
        @ns2.Getter(storeKeys.getters.foo) officiis: string;
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      import { computed } from \\"vue\\";
      const moduleC = 'moduleC';
      const foo = 'foo';
      const storeKeys = { getters: { foo: 'foo' } };
      const store = useStore();
      const bar = computed<string>(() => store.getters[foo]);
      const baz = computed<string>(() => store.getters[\`moduleB/\${foo}\`]);
      const qux = computed<string>(() => store.getters[\`\${moduleC}/\${foo}\`]);
      const harum = computed<string>(() => store.getters[storeKeys.getters.foo]);
      const ipsa = computed<string>(() => store.getters[\`moduleB/\${storeKeys.getters.foo}\`]);
      const officiis = computed<string>(() => store.getters[\`\${moduleC}/\${storeKeys.getters.foo}\`]);
      "
    `);
  });

  it("should transform getter with namespace", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Vue } from 'vue-property-decorator';
      import { Getter } from 'vuex-class';
      @Component
      export default class Foo {
        @Getter('ns/foo') bar: string;
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      import { computed } from \\"vue\\";
      const store = useStore();
      const bar = computed<string>(() => store.getters['ns/foo']);
      "
    `);
  });

  it("should transform getter with namespace and variable", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Vue } from 'vue-property-decorator';
      import { Getter } from 'vuex-class';
      const foo = 'foo';
      @Component
      export default class Foo {
        @Getter('ns/' + foo) bar: () => string;
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      import { computed } from \\"vue\\";
      const foo = 'foo';
      const store = useStore();
      const bar = computed<() => string>(() => store.getters['ns/' + foo]);
      "
    `);
  });

  it("should throw if provided an arrow function", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Vue } from 'vue-property-decorator';
      import { Getter } from 'vuex-class';
      @Component
      export default class Foo {
        @Getter(s => s.foo.bar) bar: string;
      }
    `);

    expect(() => convertDefaultClassComponent(ast, program)).toThrowError(
      `[vuex-class] Unexpected decorator argument, expected String or Identifier got ArrowFunction`,
    );
  });
});

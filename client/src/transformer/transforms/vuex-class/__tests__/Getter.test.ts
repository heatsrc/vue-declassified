import { convertAst } from "@/convert";
import { getSingleFileProgram } from "@/parser";
import { describe, expect, it } from "vitest";

describe("Getter decorator", () => {
  it("should transform getter", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Vue } from 'vue-property-decorator';
      import { Getter } from 'vuex-class';
      @Component
      export default class Foo {
        @Getter bar: string;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      import { computed } from \\"vue\\";
      const store = useStore();
      const bar = computed<string>(() => store.getters.bar);
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
    const result = convertAst(ast, program);

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
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      import { computed } from \\"vue\\";
      const foo = 'foo';
      const store = useStore();
      const bar = computed<() => string>(() => store.getters['ns/' + foo]);
      "
    `);
  });

  it("should transform getter with variable", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Vue } from 'vue-property-decorator';
      import { Getter } from 'vuex-class';
      @Component
      export default class Foo {
        @Getter(s => s.foo.bar) bar: string;
      }
    `);

    expect(() => convertAst(ast, program)).toThrowError(
      `[vuex-class] Arrow functions are not supported for @Getter`,
    );
  });
});

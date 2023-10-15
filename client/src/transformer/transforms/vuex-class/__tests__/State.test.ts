import { convertAst } from "@/convert";
import { getSingleFileProgram } from "@/parser";
import { describe, expect, it } from "vitest";

describe("State decorator", () => {
  it("should transform state", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Vue } from 'vue-property-decorator';
      import { State } from 'vuex-class';
      @Component
      export default class Foo {
        @State bar: string;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      import { computed } from \\"vue\\";
      const store = useStore();
      const bar = computed<string>(() => store.state.bar);
      "
    `);
  });

  it("should transform state with namespace", () => {
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
      const bar = computed<string>(() => store.state['ns/foo']);
      "
    `);
  });

  it("should transform state with namespace and variable", () => {
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

  it("should transform state with callback as decorator arg", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Vue } from 'vue-property-decorator';
      import { State } from 'vuex-class';
      @Component
      export default class Foo {
        @State(s => s.foo.bar) bar: string;
      }
    `);

    const result = convertAst(ast, program);
    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      import { computed } from \\"vue\\";
      const store = useStore();
      const bar = computed<string>(() => store.state.foo.bar);
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
});

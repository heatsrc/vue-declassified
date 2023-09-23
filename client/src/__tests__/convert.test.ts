import { describe, it, expect } from "vitest";
import { convertAst } from "../convert.js";
import { getSingleFileProgram } from "../parser.js";

describe("convert", () => {
  it("should throw if no vue class component import", () => {
    let content = "@Component\nexport class Test {}";
    const { ast, program } = getSingleFileProgram(content);
    expect(() => convertAst(ast, program)).toThrowError(
      "No vue class component import found in this file",
    );
  });

  describe("getting default export", () => {
    it("should throw if no default export", () => {
      let content = `
      import { Component, Prop } from "vue-class-component";
      @Component
      export class Test {
        @Prop() hello!: string;
      }`;
      const { ast, program } = getSingleFileProgram(content);
      expect(() => convertAst(ast, program)).toThrowError("No default export found in this file");
    });

    it("should throw if default export is not a class", () => {
      let content = `
      import { Component } from "vue-class-component";
      @Component
      export function Test() {
        return <div>Hello</div>
      }`;
      const { ast, program } = getSingleFileProgram(content);
      expect(() => convertAst(ast, program)).toThrowError("No default export found in this file");
    });

    it('should throw if default export is not decorated with "@Component" or "@Options"', () => {
      let content = `
      import { Prop } from "vue-class-component";
      export class Test {
        @Prop() hello!: string;
      }`;
      const { ast, program } = getSingleFileProgram(content);
      expect(() => convertAst(ast, program)).toThrowError("No default export found in this file");
    });

    it('should not throw if default export is decorated with "@Component"', () => {
      let content = `
      import { Component, Prop } from "vue-class-component";
      @Component
      export default class Test {
        @Prop() hello!: string;
      }`;
      const { ast, program } = getSingleFileProgram(content);
      expect(() => convertAst(ast, program)).not.toThrow();
    });

    it('should not throw if default export is decorated with "@Options"', () => {
      let content = `
      import { Options, Prop } from "vue-class-component";
      @Options()
      export default class Test {
        @Prop() hello!: string;
      }`;
      const { ast, program } = getSingleFileProgram(content);
      expect(() => convertAst(ast, program)).not.toThrow();
    });
  });

  it("should order imports before other statements", () => {
    let content = `
    import { Component, Prop } from "vue-class-component";
    import { bar } from "./bar.js";

    @Component
    export default class Test {
      // Properties
      world = "world";
      @Prop() hello!: string;

      // Accessors
      get hello() {
        return this.hello;
      }

      get foo() {
        return this.hello + this.world;
      }
      set foo(value) {
        this.hello = value;
      }

      set bar(value) {
        this.world = value;
      }

      // Methods
      getFoo() {
        return this.foo;
      }

      @Emit("foo")
      handleFoo(value) {
        this.foo = value;
        return this.foo;
      }
    }
    import foo from "foo";`;

    const { ast, program } = getSingleFileProgram(content);
    const result = convertAst(ast, program);

    // XXX this snapshot is a WIP, it's not the final result
    expect(result).toMatchInlineSnapshot(`
      "import { bar } from \\"./bar.js\\";
      import foo from \\"foo\\";
      import { computed, ref } from \\"vue\\";
      // Accessors
      const hello = computed(() => {
          return this.hello;
      });
      const foo = computed({
          get: () => {
              return this.hello + this.world;
          },
          set: (value) => {
              this.hello = value;
          }
      });
      // VEXUS_TODO: setter with no getter is suspicious...
      const bar = computed({
          set: (value) => {
              this.world = value;
          }
      });
      // Properties
      const world = ref(\\"world\\");
      // VEXUS_TODO: Encountered unsupported Decorator(s): \\"@Prop() hello!: string;\\")
      let hello: string;
      // Methods
      const getFoo = () => {
          return this.foo;
      };
      // VEXUS_TODO: Encountered unsupported decorator(s): \\"@Emit\\"
      const handleFoo = (value) => {
          this.foo = value;
          return this.foo;
      };
      "
    `);
  });
});

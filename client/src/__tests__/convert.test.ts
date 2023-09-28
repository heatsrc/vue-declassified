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
        this.divElement.innerText = value;
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
        this.undefinedProperty = value;
        return this.foo;
      }

      // Template Refs
      $refs: { divElement: HTMLDivElement; b; };


      // Lifecycle hooks
      beforeCreate() {
        console.log('beforeCreate');
      }
      created() {
        console.log('created');
      }
      beforeMount() {
        console.log('beforeMounted');
      }
      mounted() {
        console.log('onMounted');
      }
      beforeUpdate() {
        console.log('beforeUpdate');
      }
      updated() {
        console.log('updated');
      }
      beforeDestroy() {
        console.log('beforeDestroy');
      }
      destroyed() {
        console.log('destroyed');
      }
      activated() {
        console.log('activated');
      }
      deactivated() {
        console.log('deactivated');
      }
      errorCaptured() {
        console.log('errorCaptured');
      }
    }
    import foo from "foo";`;

    const { ast, program } = getSingleFileProgram(content);
    const result = convertAst(ast, program);

    // XXX this snapshot is a WIP, it's not the final result
    expect(result).toMatchInlineSnapshot(`
      "import { bar } from \\"./bar.js\\";
      import foo from \\"foo\\";
      import { ref, onBeforeMount, onMounted, onBeforeUpdate, onUpdated, onBeforeUnmount, onUnmounted, onActivated, onDeactivated, onErrorCaptured, computed } from \\"vue\\";
      // Properties
      const world = ref(\\"world\\");
      // VEXUS_TODO: Encountered unsupported Decorator(s): \\"@Prop() hello!: string;\\")
      let hello: string;
      // VEXUS_TODO: Check for potential naming collisions from '$refs.divElement' conversion.
      // Template Refs
      const divElement = ref<HTMLDivElement>();
      // VEXUS_TODO: Check for potential naming collisions from '$refs.b' conversion.
      const b = ref();
      console.log('beforeCreate');
      console.log('created');
      onBeforeMount(() => {
          console.log('beforeMounted');
      });
      onMounted(() => {
          console.log('onMounted');
      });
      onBeforeUpdate(() => {
          console.log('beforeUpdate');
      });
      onUpdated(() => {
          console.log('updated');
      });
      onBeforeUnmount(() => {
          console.log('beforeDestroy');
      });
      onUnmounted(() => {
          console.log('destroyed');
      });
      onActivated(() => {
          console.log('activated');
      });
      onDeactivated(() => {
          console.log('deactivated');
      });
      onErrorCaptured(() => {
          console.log('errorCaptured');
      });
      // Accessors
      const hello = computed(() => {
          return hello.value;
      });
      const foo = computed({
          get: () => {
              return hello.value + world.value;
          },
          set: (value) => {
              divElement.value.innerText = value;
              hello.value = value;
          }
      });
      // VEXUS_TODO: setter with no getter is suspicious...
      const bar = computed({
          set: (value) => {
              world.value = value;
          }
      });
      // Methods
      const getFoo = () => {
          return foo.value;
      };
      // VEXUS_TODO: Encountered unsupported decorator(s): \\"@Emit\\"
      const handleFoo = (value) => {
          // VEXUS_TODO: Unknown variable source for \\"this.undefinedProperty\\"
          this.undefinedProperty = value;
          return foo.value;
      };
      "
    `);
  });
});

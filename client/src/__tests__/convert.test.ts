import { describe, expect, it } from "vitest";
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

    const MOUNT_EVENT = 'component:mounted';

    @Component
    export default class Test {
      // Properties
      world = "world";
      @Prop() hello!: string;

      // Accessors
      get hello() {
        this.$props.fdsa;
        return this.hello;
      }

      get foo() {
        this.$route.query;
        return this.hello + this.world;
      }
      set foo(value) {
        this.divElement.innerText = value;
        this.hello = value;
      }

      set bar(value) {
        this.$router.push('');
        this.world = value;
      }

      // Methods
      async getFoo() {
        await this.$nextTick();
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
        this.$watch(this.foo, (newVal: string, oldVal = 'old')  => {
          this.$emit('foo:changed', newVal, oldVal);
        })
      }
      beforeMount() {
        this.$emit(MOUNT_EVENT);
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
        this.$store.dispatch('foo', this.foo);
        console.log('activated');
      }
      deactivated() {
        console.log('deactivated', this.$props.asdf);
      }
      errorCaptured() {
        this.$store.dispatch('foo', this.foo);
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
      import { useRoute, useRouter } from \\"vue-router\\";
      import { useStore } from \\"vuex\\";
      import { ref, nextTick, watch, onBeforeMount, onMounted, onBeforeUpdate, onUpdated, onBeforeUnmount, onUnmounted, onDeactivated, computed, onActivated, onErrorCaptured } from \\"vue\\";
      const MOUNT_EVENT = 'component:mounted';
      const props = defineProps<{
          \\"fdsa\\": unknown;
          \\"asdf\\": unknown;
      }>();
      const emit = defineEmits<{
          \\"foo:changed\\": [
              newVal: string,
              oldVal: string
          ];
          \\"component:mounted\\": [
          ];
      }>();
      const route = useRoute();
      const router = useRouter();
      const store = useStore();
      // Properties
      const world = ref(\\"world\\");
      // VUEDC_TODO: Encountered unsupported Decorator(s): \\"@Prop() hello!: string;\\")
      let hello: string;
      // VUEDC_TODO: Check for potential naming collisions from '$refs.divElement' conversion.
      // Template Refs
      const divElement = ref<HTMLDivElement>();
      // VUEDC_TODO: Check for potential naming collisions from '$refs.b' conversion.
      const b = ref();
      console.log('beforeCreate');
      onBeforeMount(() => {
          // VUEDC_TODO: Unknown variable source for \\"this.$emit\\"
          this.$emit(MOUNT_EVENT);
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
      onDeactivated(() => {
          console.log('deactivated', 
          // VUEDC_TODO: Unknown variable source for \\"this.$props\\"
          this.$props.asdf);
      });
      // Accessors
      const hello = computed(() => {
          // VUEDC_TODO: Unknown variable source for \\"this.$props\\"
          this.$props.fdsa;
          return hello.value;
      });
      const foo = computed({
          get: () => {
              // VUEDC_TODO: Unknown variable source for \\"this.$route\\"
              this.$route.query;
              return hello.value + world.value;
          },
          set: (value) => {
              divElement.value.innerText = value;
              hello.value = value;
          }
      });
      // VUEDC_TODO: setter with no getter is suspicious...
      const bar = computed({
          set: (value) => {
              // VUEDC_TODO: Unknown variable source for \\"this.$router\\"
              this.$router.push('');
              world.value = value;
          }
      });
      // Methods
      const getFoo = 
      // Methods
      async () => {
          await 
          // VUEDC_TODO: Unknown variable source for \\"this.$nextTick\\"
          this.$nextTick();
          return foo.value;
      };
      // VUEDC_TODO: Encountered unsupported decorator(s): \\"@Emit\\"
      const handleFoo = (value) => {
          // VUEDC_TODO: Unknown variable source for \\"this.undefinedProperty\\"
          this.undefinedProperty = value;
          return foo.value;
      };
      console.log('created');
      // VUEDC_TODO: Unknown variable source for \\"this.$watch\\"
      this.$watch(foo.value, (newVal: string, oldVal = 'old') => {
          // VUEDC_TODO: Unknown variable source for \\"this.$emit\\"
          this.$emit('foo:changed', newVal, oldVal);
      });
      onActivated(() => {
          // VUEDC_TODO: Unknown variable source for \\"this.$store\\"
          this.$store.dispatch('foo', foo.value);
          console.log('activated');
      });
      onErrorCaptured(() => {
          // VUEDC_TODO: Unknown variable source for \\"this.$store\\"
          this.$store.dispatch('foo', foo.value);
          console.log('errorCaptured');
      });
      "
    `);
  });
});

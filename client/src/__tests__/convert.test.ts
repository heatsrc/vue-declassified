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

    @Component({
      props: {
        fdsa: String,
        asdf: {
          type: Object,
          required: false,
          default: () => {foo: 'bar'},
        }
      },
      watch: {
        world: (val, oldVal) => { this.$emit('foo:changed', val, oldVal) },
        b: function (val, oldVal) {
          console.log('new: %s, old: %s', val, oldVal);
        },
        'c.d.e': [{
          handler: 'handleFoo',
          deep: true,
        }, 'getFoo'],
      },
      expose: ['b', 'foo', 'world'],

    })
    export default class Test {
      // Properties
      @Getter() myGetter: string;
      @Ref() button: HTMLButtonElement;
      @Ref('aCheckbox') checkbox;
      world = "world";
      b = "b";
      c = { d: { e: "f" } };
      @Prop() propC!: string;
      @Prop({ type: Boolean, default: false, required: false }) propA: boolean;
      @Prop({ type: [Number, String], default: 0 }) propB;

      // Accessors
      get hello() {
        this.$props.fdsa;
        return this.propC;
      }

      get foo(): string {
        this.$route.query;
        return this.hello + this.world;
      }
      set foo(value: string) {
        this.divElement.innerText = value;
        this.hello = value;
      }

      set bar(value) {
        this.$router.push('');
        this.world = value;
      }

      // Methods
      @Watch('foo')
      getFoo() {
        await this.$nextTick();
        return this.foo;
      }

      @Emit("fooBar")
      handleFoo(value: string) {
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
        this.button.innerText = this.foo;
        console.log('beforeUpdate');
      }
      updated() {
        this.checkbox.checked = true;
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
      import { ref, reactive, nextTick, watch, onMounted, onBeforeUnmount, onUnmounted, computed, onBeforeMount, onBeforeUpdate, onUpdated, onActivated, onDeactivated, onErrorCaptured } from \\"vue\\";
      const MOUNT_EVENT = 'component:mounted';
      const props = withDefaults(defineProps<{
          \\"fdsa\\": string;
          \\"asdf\\"?: Record<string, unknown>;
          \\"propC\\": string;
          \\"propA\\"?: boolean;
          \\"propB\\": number | string;
      }>(), {
          asdf: () => { foo: \\"bar\\"; },
          propA: false,
          propB: 0
      });
      const emit = defineEmits<{
          \\"fooBar\\": [
              value: string,
              returnVal: string
          ];
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
      /* VUEDC_TODO: Encountered unsupported Decorator(s): \\"@Getter() myGetter: string;\\")*/ let myGetter: string;
      const button = ref<HTMLButtonElement>();
      /* VUEDC_TODO: Update template, replace 'ref=\\"'aCheckbox'\\"' with 'ref=\\"checkbox\\"'*/ const checkbox = ref();
      const world = ref(\\"world\\");
      const b = ref(\\"b\\");
      const c = reactive({ d: { e: \\"f\\" } });
      /* VUEDC_TODO: Check for potential naming collisions from '$refs.divElement' conversion.*/ 
      // Template Refs
      const divElement = ref<HTMLDivElement>();
      /* VUEDC_TODO: Check for potential naming collisions from '$refs.b' conversion.*/ const b = ref();
      console.log('beforeCreate');
      onMounted(() => {
          console.log('onMounted');
      });
      onBeforeUnmount(() => {
          console.log('beforeDestroy');
      });
      onUnmounted(() => {
          console.log('destroyed');
      });
      // Accessors
      const hello = computed(() => {
          props.fdsa;
          return props.propC;
      });
      const foo = computed({
          get: (): string => {
              route.query;
              return hello.value + world.value;
          },
          set: (value: string) => {
              divElement.value.innerText = value;
              hello.value = value;
          }
      });
      /* VUEDC_TODO: setter with no getter is suspicious...*/ const bar = computed({
          set: (value) => {
              router.push('');
              world.value = value;
          }
      });
      // Methods
      const getFoo = () => {
          await nextTick();
          return foo.value;
      };
      const handleFoo = (value: string) => {
          /* VUEDC_TODO: Unknown variable source for \\"this.undefinedProperty\\"*/ this.undefinedProperty = value;
          const returnVal = foo.value;
          emit(\\"foo-bar\\", returnVal, value);
          return returnVal;
      };
      console.log('created');
      watch(foo.value, (newVal: string, oldVal = 'old') => {
          emit('foo:changed', newVal, oldVal);
      });
      onBeforeMount(() => {
          emit(MOUNT_EVENT);
          console.log('beforeMounted');
      });
      onBeforeUpdate(() => {
          button.value.innerText = foo.value;
          console.log('beforeUpdate');
      });
      onUpdated(() => {
          checkbox.value.checked = true;
          console.log('updated');
      });
      onActivated(() => {
          store.dispatch('foo', foo.value);
          console.log('activated');
      });
      onDeactivated(() => {
          console.log('deactivated', props.asdf);
      });
      onErrorCaptured(() => {
          store.dispatch('foo', foo.value);
          console.log('errorCaptured');
      });
      watch(world, (val, oldVal) => { emit('foo:changed', val, oldVal); });
      watch(b, function (val, oldVal) {
          console.log('new: %s, old: %s', val, oldVal);
      });
      watch(() => c?.d?.e, handleFoo, { deep: true });
      watch(() => c?.d?.e, getFoo);
      watch(foo, getFoo);
      defineExpose({ b, foo, world });
      "
    `);
  });
});

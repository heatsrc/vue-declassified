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
    import { bar, b } from "./bar.js";
    import MyComponent from "./MyComponent.vue";

    const MOUNT_EVENT = 'component:mounted';
    const profile = 'profile';
    const prefs = 'userPreferences';


    @Component({
      props: {
        fdsa: String,
        asdf: {
          type: Object,
          required: false,
          default: () => (['bar']),
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
      emits: ['fooBar', 'something-new']
    })
    export default class Test {
      MyComponent = MyComponent;
      // Properties
      @Ref() button: HTMLButtonElement;
      @Ref('aCheckbox') checkbox;
      world = "world";
      @Provide('pB') b = "b";
      c = { d: { e: "f" } };
      @Prop() propC!: string;
      @Prop({ type: Boolean, default: false, required: false }) propA: boolean;
      @Prop({ type: [Number, String], default: 0 }) propB;
      @Prop({ default: () => ({foo: 'bar'})) propD;
      @Inject() iFoo: string;
      @Inject('bar') iBaz: string;
      @Inject({ from: 'optional', default: () => ({ foo: 'bar' }) }) iOptional: { foo: string };

      // Vuex State
      @State title: string;
      @State('car') vehicle;
      @State(userProfile) userProfile: Profile;
      @State((s) => s.user.isAdmin) isAdmin: boolean;

      // Vuex Getters
      @Getter direction: string;
      @Getter('speed') velocity: number;
      @Getter(profile) adminProfile: (id: number) => Profile;

      // Vuex Actions
      @Action fetchUser: (id: number) => Promise<User>;
      @Action('user/fetchUser') fetchAdmin: (id: number) => Promise<User>;
      @Action(prefs) fetchPrefs;

      // Vuex Mutations
      @Mutation updateTitle: (title: string) => void;
      @Mutation('user/updateTitle') updateAdminTitle: (title: string) => void;
      @Mutation(profile) updateAdminProfile;

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
        this.$emit(MOUNT_EVENT, this.b);
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
      "import { bar, b } from \\"./bar.js\\";
      import MyComponent from \\"./MyComponent.vue\\";
      import foo from \\"foo\\";
      import { useStore } from \\"vuex\\";
      import { useRoute, useRouter } from \\"vue-router\\";
      import { reactive, ref, inject, computed, nextTick, watch, onMounted, onBeforeUnmount, onUnmounted, provide, onBeforeMount, onBeforeUpdate, onUpdated, onActivated, onDeactivated, onErrorCaptured } from \\"vue\\";
      const MOUNT_EVENT = 'component:mounted';
      const profile = 'profile';
      const prefs = 'userPreferences';
      /* VUEDC_TODO: Fix naming collisions
       
         - \`MyComponent\` is defined in: External imports
         - \`b\` is defined in: External imports, Other variables
         - \`foo\` is defined in: External imports
         - \`bar\` is defined in: External imports

         It is strongly suggested you fix these prior to
         converting the file. Usage of these variables may
         be ambiguous in the converted code.
      */
      const props = withDefaults(defineProps<{
          \\"fdsa\\": string;
          \\"asdf\\"?: Record<string, unknown>;
          \\"propC\\": string;
          \\"propA\\"?: boolean;
          \\"propB\\": number | string;
          \\"propD\\": unknown;
      }>(), {
          asdf: () => ([\\"bar\\"]),
          propA: false,
          propB: 0,
          propD: () => ({ foo: \\"bar\\" })
      });
      const emit = defineEmits<{
          \\"fooBar\\": [
              value: string,
              returnVal: string
          ];
          \\"something-new\\": [
              ...args: unknown[]
          ];
          \\"foo:changed\\": [
              newVal: string,
              oldVal: string
          ];
          \\"component:mounted\\": [
              _b0: unknown
          ];
      }>();
      const store = useStore();
      const route = useRoute();
      const router = useRouter();
      const MyComponent = reactive(MyComponent);
      // Properties
      const button = ref<HTMLButtonElement>();
      /* VUEDC_TODO: Update template, replace 'ref=\\"'aCheckbox'\\"' with 'ref=\\"checkbox\\"'*/ const checkbox = ref();
      const world = ref(\\"world\\");
      const b = ref(\\"b\\");
      const c = reactive({ d: { e: \\"f\\" } });
      const iFoo = inject(\\"iFoo\\");
      const iBaz = inject(\\"bar\\");
      const iOptional = inject(\\"'optional'\\", () => ({ foo: \\"bar\\" }));
      // Vuex State
      const title = computed<string>(() => store.state.title);
      const vehicle = computed(() => store.state['car']);
      const userProfile = computed<Profile>(() => store.state[userProfile]);
      const isAdmin = computed<boolean>(() => store.state.user.isAdmin);
      // Vuex Getters
      const direction = computed<string>(() => store.getters.direction);
      const velocity = computed<number>(() => store.getters['speed']);
      const adminProfile = computed<(id: number) => Profile>(() => store.getters[profile]);
      // Vuex Actions
      const fetchUser = async (id: number): Promise<User> => store.dispatch(\\"fetchUser\\", id);
      const fetchAdmin = async (id: number): Promise<User> => store.dispatch('user/fetchUser', id);
      /* VUEDC_TODO: Check function dispatch call signature.*/ const fetchPrefs = async (...args: unknown[]): Promise<unknown> => store.dispatch(prefs, args);
      // Vuex Mutations
      const updateTitle = (title: string): void => store.commit(\\"updateTitle\\", title);
      const updateAdminTitle = (title: string): void => store.commit('user/updateTitle', title);
      /* VUEDC_TODO: Check function dispatch call signature.*/ const updateAdminProfile = (...args: unknown[]): unknown => store.commit(profile, args);
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
      provide('pB', b)
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
          emit(MOUNT_EVENT, b.value);
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

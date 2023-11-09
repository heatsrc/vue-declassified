import { convertMixinClassComponents } from "@/convert";
import { getSingleFileProgram } from "@/parser";
import { setIsMixin } from "@/registry";
import { beforeEach, describe, expect, it } from "vitest";

describe("processPropertyAccessAndSort test", () => {
  beforeEach(() => setIsMixin());

  it("should process property access and sorts by dependencies", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Vue, Prop, Emit, Watch } from 'vue-property-decorator';
      import Foo from './Foo';

      @Component()
      export class Foo extends Vue {
        @Watch('bar')
        handleBarChange(newVal: Foo) {
          this.foo = \`\${newVal.toString()}\`;
          this.bar();
          this.$router.push({ name: 'eveniet' });
        });

        const bar() {
          if (this.b > 0) {
            this.$emit('foo', this.foo);
          }

          this.$store.dispatch('eos');
        }

        @Prop() b: number;
        foo: string = 'foo';
      }
    `);
    const result = convertMixinClassComponents(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { Component, Vue, Prop, Emit, Watch } from \\"vue-property-decorator\\";
      import Foo from \\"./Foo\\";
      @Component()
      export class Foo extends Vue {
          @Watch('bar')
          handleBarChange(newVal: Foo) {
              this.foo = \`\${newVal.toString()}\`;
              this.bar();
              this.$router.push({ name: 'eveniet' });
          }
          ;
          const bar() {
              if (this.b > 0) {
                  this.$emit('foo', this.foo);
              }
              this.$store.dispatch('eos');
          }
          @Prop()
          b: number;
          foo: string = 'foo';
      }

      export function useFoo(router, store, emit, props) {
          const foo = ref<string>(\\"foo\\");
          const bar = const () => {
              if (props.b > 0) {
                  emit('foo', foo.value);
              }
              store.dispatch('eos');
          };
          const handleBarChange = (newVal: Foo) => {
              foo.value = \`\${newVal.toString()}\`;
              bar();
              router.push({ name: 'eveniet' });
          };
          watch(bar, handleBarChange);
          
          return { foo, bar, handleBarChange };
      }
      "
    `);
  });

  it("should convert multiple mixins found in a single file", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Vue, Prop, Emit, Watch } from 'vue-property-decorator';
      import Foo from './Foo';

      @Component()
      export class FooMixin extends Vue {
        toggle() {
        }
      }

      @Component()
      export class BarMixin extends Vue {
        open() {
        }
      }
    `);
    const result = convertMixinClassComponents(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { Component, Vue, Prop, Emit, Watch } from \\"vue-property-decorator\\";
      import Foo from \\"./Foo\\";
      @Component()
      export class FooMixin extends Vue {
          toggle() {
          }
      }
      @Component()
      export class BarMixin extends Vue {
          open() {
          }
      }

      export function useFoo() {
          const toggle = () => {
          };
          
          return { toggle };
      }

      export function useBar() {
          const open = () => {
          };
          
          return { open };
      }
      "
    `);
  });
});
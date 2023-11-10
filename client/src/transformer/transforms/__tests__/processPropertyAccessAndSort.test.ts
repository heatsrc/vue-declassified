import { convertDefaultClassComponent } from "@/convert";
import { getSingleFileProgram } from "@/parser";
import { describe, expect, it } from "vitest";

describe("processPropertyAccessAndSort test", () => {
  it("should process property access and sorts by dependencies", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Vue, Prop, Emit, Watch } from 'vue-property-decorator';
      @Component()
      export default class Foo {
        @Watch('b')
        handleBPropChange(newVal: number) {
          this.foo = \`\${newVal}\`;
          this.bar();
        });

        const bar() {
          this.$emit('foo', this.foo);
        }

        @Prop() b: number;
        foo: string = 'foo';
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { ref } from \\"vue\\";
      const emit = defineEmits<{
          \\"foo\\": [
              _foo0: string
          ];
      }>();
      const props = defineProps<{
          \\"b\\": number;
      }>();
      const foo = ref<string>(\\"foo\\");
      const bar = const () => {
          emit('foo', foo.value);
      };
      const handleBPropChange = (newVal: number) => {
          foo.value = \`\${newVal}\`;
          bar();
      };
      watch(b, handleBPropChange);
      "
    `);
  });
});

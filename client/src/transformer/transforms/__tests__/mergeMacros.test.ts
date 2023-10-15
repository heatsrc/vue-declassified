import { convertAst } from "@/convert";
import { getSingleFileProgram } from "@/parser";
import { describe, expect, it } from "vitest";

describe("mergeMacros test", () => {
  it("should collect all macros and merge them by type", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Vue, Prop, Emit } from 'vue-property-decorator';
      import { State } from 'vuex-class';
      @Component({
        props: {
          a: String,
          b: {type: Number, required: false, default: 0},
        },
        emits: ['a', 'b'],
      })
      export default class Foo {
        @Prop() aProp: string;
        @Emit('foo') aEmit(a: string) {}
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "const props = withDefaults(defineProps<{
          \\"a\\": string;
          \\"b\\"?: number;
          \\"aProp\\": string;
      }>(), {
          b: 0
      });
      const emit = defineEmits<{
          \\"a\\": [
              ...args: unknown[]
          ];
          \\"b\\": [
              ...args: unknown[]
          ];
          \\"foo\\": [
              a: string
          ];
      }>();
      const aEmit = (a: string) => {
          emit(\\"foo\\", a);
      };
      "
    `);
  });
});

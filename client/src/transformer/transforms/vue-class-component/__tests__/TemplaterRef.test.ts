import { convertDefaultClassComponent } from "@/convert.js";
import { getSingleFileProgram } from "@/parser.js";
import { describe, expect, it } from "vitest";

describe("TemplateRef", () => {
  it("should transform template ref", () => {
    const { ast, program } = getSingleFileProgram(`
      import {Component, Ref} from 'vue-property-decorator';
      @Component
      export default class Foo {
        $refs!: { a: HTMLDivElement }

        nesciunt() {
          this.$refs.a.focus();
        }
      }


    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { ref } from \\"vue\\";
      /* [VUEDC_TODO]: Check for potential naming collisions from '$refs.a' conversion.*/ const a = ref<HTMLDivElement>();
      const nesciunt = () => {
          a.value.focus();
      };
      "
    `);
  });
});

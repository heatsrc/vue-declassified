import { convertDefaultClassComponent } from "@/convert";
import { getSingleFileProgram } from "@/parser";
import { describe, expect, it } from "vitest";

describe("@Component props definition", () => {
  it("should transform a array of strings", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Options } from 'vue-class-component';
      @Options({ props: ['a', 'b', 'c'] })
      export default class Foo {}
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "const props = defineProps<{
          \\"a\\": unknown;
          \\"b\\": unknown;
          \\"c\\": unknown;
      }>();
      "
    `);
  });

  it("should transform a object with type", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Options } from 'vue-class-component';
      @Options({ props: { a: String, b: Boolean, c: Number } })
      export default class Foo {}
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "const props = defineProps<{
          \\"a\\": string;
          \\"b\\": boolean;
          \\"c\\": number;
      }>();
      "
    `);
  });

  it("should transform a object with type and default value", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Options } from 'vue-class-component';
      @Options({ props: {
        a: { type: String, default: 'a', required: false },
        b: { type: Boolean, default: true, required: false },
        c: { type: Number, default: 1, required: false }
      } })
      export default class Foo {}
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "const props = withDefaults(defineProps<{
          \\"a\\"?: string;
          \\"b\\"?: boolean;
          \\"c\\"?: number;
      }>(), {
          a: \\"a\\",
          b: true,
          c: 1
      });
      "
    `);
  });

  it("should transform a object with type and default value as a function", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Options } from 'vue-class-component';
      @Options({ props: {
        a?: { type: Object, default: () => ({}), required: false },
        b?: { type: Array, default: () => ([]), required: false },
      } })
      export default class Foo {}
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "const props = withDefaults(defineProps<{
          \\"a\\"?: Record<string, unknown>;
          \\"b\\"?: unknown[];
      }>(), {
          a: () => ({}),
          b: () => ([])
      });
      "
    `);
  });

  it("should throw an error if the props option is not an array or an object", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Options } from 'vue-class-component';
      @Options({ props: 'a' })
      export default class Foo {}
    `);
    expect(() => convertDefaultClassComponent(ast, program)).toThrowError(
      "[vue-class-component] props option expecting `string[] | Object`",
    );
  });
});

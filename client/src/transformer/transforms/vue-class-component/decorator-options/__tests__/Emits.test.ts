import { convertDefaultClassComponent } from "@/convert.js";
import { getSingleFileProgram } from "@/parser.js";
import { describe, expect, it } from "vitest";

describe("Emits", () => {
  it("should transform emits", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component } from 'vue-class-component';
      @Component({ emits: ['a', 'b', 'c'] })
      export default class Foo { }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "const emit = defineEmits<{
          \\"a\\": [
              ...args: unknown[]
          ];
          \\"b\\": [
              ...args: unknown[]
          ];
          \\"c\\": [
              ...args: unknown[]
          ];
      }>();
      "
    `);
  });

  it("should attempt to infer the type of the event arguments", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component } from 'vue-class-component';
      @Component({ emits: ['a', 'b', 'c'] })
      export default class Foo {
        foo(a: string, b: number, c: boolean) {
          this.$emit('a', a);
          this.$emit('b', b);
          this.$emit('c', c);
        }
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "const emit = defineEmits<{
          \\"a\\": [
              a: string
          ];
          \\"b\\": [
              b: number
          ];
          \\"c\\": [
              c: boolean
          ];
      }>();
      const foo = (a: string, b: number, c: boolean) => {
          emit('a', a);
          emit('b', b);
          emit('c', c);
      };
      "
    `);
  });

  it("should transform emits with object literal arguments", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component } from 'vue-class-component';
      @Component({ emits: ['a'] })
      export default class Foo {
        foo(a: string, b: number, c: boolean) {
          this.$emit('a', { a, b, c });
        }
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "const emit = defineEmits<{
          \\"a\\": [
              _payload2: {
                  a: string;
                  b: number;
                  c: boolean;
              }
          ];
      }>();
      const foo = (a: string, b: number, c: boolean) => {
          emit('a', { a, b, c });
      };
      "
    `);
  });

  it("should transform emits with array literal arguments", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component } from 'vue-class-component';
      @Component({ emits: ['a'] })
      export default class Foo {
        foo(a: string, b: number, c: boolean) {
          this.$emit('a', [ a, b, c ]);
        }
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "const emit = defineEmits<{
          \\"a\\": [
              _payload2: [
                  a: string,
                  b: number,
                  c: boolean
              ]
          ];
      }>();
      const foo = (a: string, b: number, c: boolean) => {
          emit('a', [a, b, c]);
      };
      "
    `);
  });

  it("should throw an error if the emits option is not an array", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component } from 'vue-class-component';
      @Component({ emits: 'a' })
      export default class Foo { }
    `);
    expect(() => convertDefaultClassComponent(ast, program)).toThrowError(
      `[vue-class-component] emits option should be string[]`,
    );
  });
});

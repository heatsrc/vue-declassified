import { convertDefaultClassComponent } from "@/convert";
import { getSingleFileProgram } from "@/parser";
import { describe, expect, it } from "vitest";

describe("Emit decorator", () => {
  it("should transform emit decorator using method name as event name", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Emit } from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Emit()
        foo() {
        }
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "const emit = defineEmits<{
          \\"foo\\": [
          ];
      }>();
      const foo = () => {
          emit(\\"foo\\");
      };
      "
    `);
  });

  it("should emit the parameter passed to the method", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Emit } from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Emit()
        foo(bar: string, baz: number) {
        }
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "const emit = defineEmits<{
          \\"foo\\": [
              bar: string,
              baz: number
          ];
      }>();
      const foo = (bar: string, baz: number) => {
          emit(\\"foo\\", bar, baz);
      };
      "
    `);
  });

  it("should transform emit decorator using event name from decorator argument", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Emit } from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Emit('bar')
        foo() {
        }
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "const emit = defineEmits<{
          \\"bar\\": [
          ];
      }>();
      const foo = () => {
          emit(\\"bar\\");
      };
      "
    `);
  });

  it("should include both method params and return value in emit", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Emit } from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Emit()
        foo(bar: string, baz: number): string {
          return 'hello';
        }
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "const emit = defineEmits<{
          \\"foo\\": [
              bar: string,
              baz: number,
              returnVal: string
          ];
      }>();
      const foo = (bar: string, baz: number): string => {
          const returnVal = 'hello';
          emit(\\"foo\\", returnVal, bar, baz);
          return returnVal;
      };
      "
    `);
  });

  it("should throw an error if there are multiple emit decorators", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Emit } from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Emit()
        @Emit()
        foo() {
        }
      }
    `);
    expect(() => convertDefaultClassComponent(ast, program)).toThrowError(
      `[vue-property-decorator] Multiple @Emit decorators found on foo`,
    );
  });

  it("should throw an error if the decorator is not a call expression", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Emit } from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Emit
        foo() {
        }
      }
    `);
    expect(() => convertDefaultClassComponent(ast, program)).toThrowError(
      `[vue-property-decorator] Expected @Emit to be a call expression`,
    );
  });
});

import { convertDefaultClassComponent } from "@/convert.js";
import { getSingleFileProgram } from "@/parser.js";
import { describe, expect, it } from "vitest";

describe("Method", () => {
  it("should transform a method to function expression", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component } from 'vue-class-component';
      @Component
      export default class Foo {
        a() { return 1 }
      }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "const a = () => { return 1; };
      "
    `);
  });

  it("should add a todo comment for unsupported decorators", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component } from 'vue-class-component';
      @Component
      export default class foo {
        @Bar
        a() { return 1 }
      }
    `);

    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "/* [VUEDC_TODO]: Encountered unsupported decorator(s): \\"@Bar\\"*/ const a = () => { return 1; };
      "
    `);
  });

  it("should strip access modifiers from methods", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component } from 'vue-class-component';
      @Component
      export default class Foo {
        public a() { return 1 }
        protected b() { return 2 }
        private c() { return 3 }
       }
    `);
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "const a = () => { return 1; };
      const b = () => { return 2; };
      const c = () => { return 3; };
      "
    `);
  });
});

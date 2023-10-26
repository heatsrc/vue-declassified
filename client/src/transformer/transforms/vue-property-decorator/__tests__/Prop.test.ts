import { convertAst } from "@/convert";
import { getSingleFileProgram } from "@/parser";
import { describe, expect, it } from "vitest";

describe("Prop decorator", () => {
  it("should transform prop decorator", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Prop } from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Prop()
        foo: string;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "const props = defineProps<{
          \\"foo\\": string;
      }>();
      "
    `);
  });

  it("should transform prop decorator with type", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Prop } from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Prop({ type: String })
        foo;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "const props = defineProps<{
          \\"foo\\": string;
      }>();
      "
    `);
  });

  it("should transform prop decorator with type and default value", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Prop } from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Prop({ type: String, default: 'bar' })
        foo;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "const props = withDefaults(defineProps<{
          \\"foo\\": string;
      }>(), {
          foo: \\"bar\\"
      });
      "
    `);
  });

  it("should transform prop decorator with type and default value as function", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Prop } from 'vue-property-decorator';
      import Bar from './Bar';
      @Component
      export default class Foo {
        @Prop({ type: String, default: () => 'bar', required: false })
        foo;
        @Prop bar: Bar;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import Bar from \\"./Bar\\";
      const props = withDefaults(defineProps<{
          \\"foo\\"?: string;
          \\"bar\\": Bar;
      }>(), {
          foo: () => \\"bar\\"
      });
      "
    `);
  });

  it("should transform prop decorator with array type", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Prop } from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Prop([Boolean, Number])
        foo: string;
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "const props = defineProps<{
          \\"foo\\": boolean | number;
      }>();
      "
    `);
  });

  it("should throw error when duplicate prop decorator", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Prop } from 'vue-property-decorator';
      @Component
      export default class Foo {
        @Prop()
        @Prop()
        foo: string;
      }
    `);
    expect(() => convertAst(ast, program)).toThrowError(
      `[vue-property-decorator] Duplicate @Prop decorators for foo`,
    );
  });
});

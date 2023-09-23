import { getSingleFileProgram } from "@/parser.js";
import { getBody, getImports } from "@/transformer/resultsProcessor.js";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { transformResults } from "./fixtures/transformResults.js";
import { printStatementsToString } from "@/helpers/utils.js";

describe("resultsProcessor", () => {
  it("should create an array or import declarations", () => {
    const { ast } = getSingleFileProgram(``);
    const imports = getImports(transformResults);

    expect(imports.length).toEqual(3);

    const result = printStatementsToString(imports, ast);

    expect(result).toMatchInlineSnapshot(`
      "import { ref } from \\"vue\\";
      import foo, { bar } from \\"./foo\\";
      import MyComponent from \\"./MyComponent.vue\\";
      "
    `);
  });

  it("should create an array of statements in the body", () => {
    const { ast } = getSingleFileProgram(``);
    const body = getBody(transformResults);

    expect(body.length).toEqual(3);

    const result = printStatementsToString(body, ast);

    expect(result).toMatchInlineSnapshot(`
      "const a = ref(\\"a\\");
      const b = reactive(foo);
      const { c } = bar;
      "
    `);
  });
});

import { describe, it, expect } from "vitest";
import { transformTemplateRef } from "../TemplateRef.js";
import { getSingleFileProgram } from "@/parser.js";
import { VxReferenceKind, VxResultKind } from "@/types.js";
import { shouldBeTruthy } from "@test/customAssertions.js";
import ts from "typescript";

describe("TemplateRef", () => {
  it("should transform template ref", () => {
    const { ast, program } = getSingleFileProgram(`
      class foo {
        $refs!: { a: HTMLDivElement }
      }
    `);
    const property = (ast.statements[0] as ts.ClassDeclaration)
      .members[0] as ts.PropertyDeclaration;
    const output = transformTemplateRef(property, program);

    shouldBeTruthy(output);
    expect(output.tag).toBe("TemplateRef");
    expect(output.reference).toBe(VxReferenceKind.VARIABLE_VALUE);
    expect(output.kind).toBe(VxResultKind.COMPOSITION);
    expect(output.nodes.length).toBe(1);
    expect(output.outputVariables).toEqual(["a"]);
    expect((output.nodes[0] as any).emitNode.leadingComments[0].text).toContain(
      "VEXUS_TODO: Check for potential naming collisions",
    );
  });
});

import { getSingleFileProgram } from "@/parser.js";
import { transformMethod } from "../Method.js";
import { describe, it, expect, should } from "vitest";
import ts from "typescript";
import { shouldBeTruthy } from "@test/customAssertions.js";
import { VxReferenceKind, VxResultKind } from "@/types.js";

describe("Method", () => {
  it("should transform a method to function expression", () => {
    const { ast, program } = getSingleFileProgram("class foo { a() { return 1 } }");
    const method = (ast.statements[0] as ts.ClassDeclaration).members[0] as ts.MethodDeclaration;
    const output = transformMethod(method, program);

    shouldBeTruthy(output);
    expect(output.tag).toBe("Method");
    expect(output.reference).toBe(VxReferenceKind.VARIABLE);
    expect(output.kind).toBe(VxResultKind.COMPOSITION);
    expect(output.nodes.length).toBe(1);
    expect(output.outputVariables).toEqual(["a"]);
    // no additional comments added
    expect((output.nodes[0] as any).emitNode).toBeUndefined();
  });

  it("should add a todo comment for unsupported decorators", () => {
    const { ast, program } = getSingleFileProgram(`
      class foo {
        @Bar
        a() { return 1 }
      }
    `);

    const method = (ast.statements[0] as ts.ClassDeclaration).members[0] as ts.MethodDeclaration;
    method.type?.getText();
    const output = transformMethod(method, program);

    shouldBeTruthy(output);
    expect(output.tag).toBe("Method");
    expect(output.reference).toBe(VxReferenceKind.VARIABLE);
    expect(output.kind).toBe(VxResultKind.COMPOSITION);
    expect(output.nodes.length).toBe(1);
    expect(output.outputVariables).toEqual(["a"]);
    expect((output.nodes[0] as any).emitNode.leadingComments[0].text).toContain("VEXUS_TODO");
  });
});

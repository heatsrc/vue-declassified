import { getSingleFileProgram } from "@/parser.js";
import { VxReferenceKind, VxResultKind } from "@/types.js";
import { shouldBeTruthy } from "@test/customAssertions.js";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { transformMethod } from "../Method.js";

describe("Method", () => {
  it("should transform a method to function expression", () => {
    const { ast, program } = getSingleFileProgram("class foo { a() { return 1 } }");
    const method = (ast.statements[0] as ts.ClassDeclaration).members[0] as ts.MethodDeclaration;
    const output = transformMethod(method, program);

    shouldBeTruthy(output);
    shouldBeTruthy(output.result);
    expect(output.shouldContinue).toBe(false);
    const result = output.result;
    if (Array.isArray(result)) throw new Error("Expected result to be a single node");
    expect(result.tag).toBe("Method");
    expect(result.reference).toBe(VxReferenceKind.VARIABLE);
    expect(result.kind).toBe(VxResultKind.COMPOSITION);
    expect(result.nodes.length).toBe(1);
    expect(result.outputVariables).toEqual(["a"]);
    // no additional comments added
    expect((result.nodes[0] as any).emitNode).toBeUndefined();
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
    shouldBeTruthy(output.result);
    expect(output.shouldContinue).toBe(false);
    const result = output.result;
    if (Array.isArray(result)) throw new Error("Expected result to be a single node");
    expect(result.tag).toBe("Method");
    expect(result.reference).toBe(VxReferenceKind.VARIABLE);
    expect(result.kind).toBe(VxResultKind.COMPOSITION);
    expect(result.nodes.length).toBe(1);
    expect(result.outputVariables).toEqual(["a"]);
    expect((result.nodes[0] as any).emitNode.leadingComments[0].text).toContain("VUEDC_TODO");
  });
});

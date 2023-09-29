import { getSingleFileProgram } from "@/parser.js";
import { VxReferenceKind, VxResultKind } from "@/types.js";
import { shouldBeTruthy } from "@test/customAssertions.js";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { transformData } from "../Data.js";

describe("Data", () => {
  it("should convert primitive data to ref", () => {
    const { ast, program } = getSingleFileProgram("class foo { a = 1 }");
    const property = (ast.statements[0] as ts.ClassDeclaration)
      .members[0] as ts.PropertyDeclaration;
    const output = transformData(property, program);

    shouldBeTruthy(output.result);
    expect(output.shouldContinue).toBe(false);
    const result = output.result;
    if (Array.isArray(result)) throw new Error("Expected result to be a single node");
    expect(result.tag).toBe("Data-ref");
    expect(result.reference).toBe(VxReferenceKind.VARIABLE_VALUE);
    expect(result.kind).toBe(VxResultKind.COMPOSITION);
    expect(result.nodes.length).toBe(1);
    const decList = (result.nodes[0] as ts.VariableStatement).declarationList;
    expect(decList.flags & ts.NodeFlags.Const).toBeTruthy();
    expect(decList.flags & ts.NodeFlags.Let).toBeFalsy();
    expect(result.outputVariables).toEqual(["a"]);
  });

  it("should convert uninitialized property", () => {
    const { ast, program } = getSingleFileProgram("class foo { a: number; }");
    const property = (ast.statements[0] as ts.ClassDeclaration)
      .members[0] as ts.PropertyDeclaration;
    const output = transformData(property, program);

    shouldBeTruthy(output.result);
    expect(output.shouldContinue).toBe(false);
    const result = output.result;
    if (Array.isArray(result)) throw new Error("Expected result to be a single node");
    expect(result.tag).toBe("Data-nonreactive");
    expect(result.reference).toBe(VxReferenceKind.VARIABLE);
    expect(result.kind).toBe(VxResultKind.COMPOSITION);
    expect(result.nodes.length).toBe(1);
    const decList = (result.nodes[0] as ts.VariableStatement).declarationList;
    expect(decList.declarations[0].type?.kind).toEqual(ts.SyntaxKind.NumberKeyword);
    expect(decList.flags & ts.NodeFlags.Let).toBeTruthy();
    expect(decList.flags & ts.NodeFlags.Const).toBeFalsy();
    expect(result.outputVariables).toEqual(["a"]);
  });

  it("should convert object data to reactive", () => {
    const { ast, program } = getSingleFileProgram("class foo { a: Foo = {} }");
    const property = (ast.statements[0] as ts.ClassDeclaration)
      .members[0] as ts.PropertyDeclaration;
    const output = transformData(property, program);

    shouldBeTruthy(output.result);
    expect(output.shouldContinue).toBe(false);
    const result = output.result;
    if (Array.isArray(result)) throw new Error("Expected result to be a single node");
    expect(result.tag).toBe("Data-reactive");
    expect(result.reference).toBe(VxReferenceKind.VARIABLE);
    expect(result.kind).toBe(VxResultKind.COMPOSITION);
    expect(result.nodes.length).toBe(1);
    expect(result.outputVariables).toEqual(["a"]);

    const decList = (result.nodes[0] as ts.VariableStatement).declarationList;
    const dec = decList.declarations[0] as ts.VariableDeclaration;
    const init = dec.initializer as ts.CallExpression;
    const type = (init.typeArguments as unknown as any[])[0].typeName.escapedText;

    expect(type).toEqual("Foo");
  });
});

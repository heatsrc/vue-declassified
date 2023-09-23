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

    shouldBeTruthy(output);
    expect(output.tag).toBe("Data-ref");
    expect(output.reference).toBe(VxReferenceKind.REF_VARIABLE);
    expect(output.kind).toBe(VxResultKind.COMPOSITION);
    expect(output.nodes.length).toBe(1);
    const decList = (output.nodes[0] as ts.VariableStatement).declarationList;
    expect(decList.flags & ts.NodeFlags.Const).toBeTruthy();
    expect(decList.flags & ts.NodeFlags.Let).toBeFalsy();
    expect(output.outputVariables).toEqual(["a"]);
  });

  it("should convert uninitialized property", () => {
    const { ast, program } = getSingleFileProgram("class foo { a: number; }");
    const property = (ast.statements[0] as ts.ClassDeclaration)
      .members[0] as ts.PropertyDeclaration;
    const output = transformData(property, program);

    shouldBeTruthy(output);
    expect(output.tag).toBe("Data-nonreactive");
    expect(output.reference).toBe(VxReferenceKind.VARIABLE);
    expect(output.kind).toBe(VxResultKind.COMPOSITION);
    expect(output.nodes.length).toBe(1);
    const decList = (output.nodes[0] as ts.VariableStatement).declarationList;
    expect(decList.declarations[0].type?.kind).toEqual(ts.SyntaxKind.NumberKeyword);
    expect(decList.flags & ts.NodeFlags.Let).toBeTruthy();
    expect(decList.flags & ts.NodeFlags.Const).toBeFalsy();
    expect(output.outputVariables).toEqual(["a"]);
  });

  it("should convert object data to reactive", () => {
    const { ast, program } = getSingleFileProgram("class foo { a: Foo = {} }");
    const property = (ast.statements[0] as ts.ClassDeclaration)
      .members[0] as ts.PropertyDeclaration;
    const output = transformData(property, program);

    shouldBeTruthy(output);
    expect(output.tag).toBe("Data-reactive");
    expect(output.reference).toBe(VxReferenceKind.VARIABLE);
    expect(output.kind).toBe(VxResultKind.COMPOSITION);
    expect(output.nodes.length).toBe(1);
    expect(output.outputVariables).toEqual(["a"]);

    const decList = (output.nodes[0] as ts.VariableStatement).declarationList;
    const dec = decList.declarations[0] as ts.VariableDeclaration;
    const init = dec.initializer as ts.CallExpression;
    const type = (init.typeArguments as unknown as any[])[0].typeName.escapedText;

    expect(type).toEqual("Foo");
  });
});

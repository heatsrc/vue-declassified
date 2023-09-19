import { describe, expect, it } from "vitest";
import { getSingleFileProgram } from "../parser.js";
import ts from "typescript";

describe("test parser", function () {
  it("should convert a vue file to ast and program", () => {
    let content = "@Component\nexport class Test {}";
    let { ast, program } = getSingleFileProgram(content);
    expect(ast.kind).toEqual(ts.SyntaxKind.SourceFile);
    expect(ast.statements.length).toEqual(1);
    expect(ast.statements[0].kind).toEqual(ts.SyntaxKind.ClassDeclaration);
    const classDec = ast.statements[0] as ts.ClassDeclaration;
    const children = classDec.getChildren();
    expect(children.length).toEqual(6);
    expect(classDec.name?.getText()).toEqual("Test");
    expect(program.getCompilerOptions().target).toEqual(ts.ScriptTarget.ESNext);
  });
});

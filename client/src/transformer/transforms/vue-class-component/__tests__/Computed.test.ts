import { getSingleFileProgram } from "@/parser.js";
import { VxReferenceKind, VxResultKind, VxTransformResult } from "@/types.js";
import { shouldBeTruthy } from "@test/customAssertions.js";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { mergeComputed, transformGetter, transformSetter } from "../Computed.js";

describe("Computed", () => {
  it("should transform getter", () => {
    const { ast, program } = getSingleFileProgram("class foo { get a() { return 1 } }");
    const property = (ast.statements[0] as ts.ClassDeclaration)
      .members[0] as ts.GetAccessorDeclaration;
    const output = transformGetter(property, program);
    shouldBeTruthy(output);
    shouldBeTruthy(output.result);
    expect(output.shouldContinue).toBe(false);
    const result = output.result;
    if (Array.isArray(result)) throw new Error("Expected result to be a single node");
    expect(result.tag).toBe("Computed-getter");
    expect(result.reference).toBe(VxReferenceKind.VARIABLE);
    expect(result.kind).toBe(VxResultKind.COMPOSITION);
    expect(result.nodes.length).toBe(1);
    expect(result.outputVariables).toEqual(["a"]);
  });

  it("should transform setter", () => {
    const { ast, program } = getSingleFileProgram("class foo { set a(v) { this._a = v } }");
    const property = (ast.statements[0] as ts.ClassDeclaration)
      .members[0] as ts.SetAccessorDeclaration;
    const output = transformSetter(property, program);
    shouldBeTruthy(output);
    shouldBeTruthy(output.result);
    expect(output.shouldContinue).toBe(false);
    const result = output.result;
    if (Array.isArray(result)) throw new Error("Expected result to be a single node");
    expect(result.tag).toBe("Computed-setter");
    expect(result.reference).toBe(VxReferenceKind.VARIABLE);
    expect(result.kind).toBe(VxResultKind.COMPOSITION);
    expect(result.nodes.length).toBe(1);
    expect(result.outputVariables).toEqual(["a"]);
  });

  describe("Merging computed properties", () => {
    it("should create a result for just a getter", () => {
      const { ast, program } = getSingleFileProgram(`
      class foo {
        /** get a */
        get a() {
          return 1;
        }
      }`);
      const property = (ast.statements[0] as ts.ClassDeclaration)
        .members[0] as ts.GetAccessorDeclaration;
      const output = transformGetter(property, program);
      shouldBeTruthy(output);
      shouldBeTruthy(output.result);
      expect(output.shouldContinue).toBe(false);
      const result = output.result;
      if (Array.isArray(result)) throw new Error("Expected result to be a single node");
      const merged = mergeComputed([result], program);
      shouldBeTruthy(merged);
      expect(merged[0].tag).toBe("Computed");
      expect(merged[0].reference).toBe(VxReferenceKind.VARIABLE_VALUE);
      expect(merged[0].kind).toBe(VxResultKind.COMPOSITION);
      expect(merged[0].nodes.length).toBe(1);
      expect(merged[0].outputVariables).toEqual(["a"]);
    });

    it("should merge getter and setter", () => {
      const { ast, program } = getSingleFileProgram(`
      class foo {
        get a() { return 1 }
        set a(v) { this._a = v }
      }
    `);
      const getter = (ast.statements[0] as ts.ClassDeclaration)
        .members[0] as ts.GetAccessorDeclaration;
      const setter = (ast.statements[0] as ts.ClassDeclaration)
        .members[1] as ts.SetAccessorDeclaration;
      const outputGetter = transformGetter(getter, program);
      const outputSetter = transformSetter(setter, program);
      expect(outputGetter.result).toBeTruthy();
      expect(outputSetter.result).toBeTruthy();
      const output = [outputGetter.result, outputSetter.result].filter(
        (o): o is VxTransformResult<ts.Node> => !!o,
      );
      const merged = mergeComputed(output, program);
      expect(merged.length).toBe(1);
      expect(merged[0].tag).toBe("Computed");
      expect(merged[0].reference).toBe(VxReferenceKind.VARIABLE_VALUE);
      expect(merged[0].kind).toBe(VxResultKind.COMPOSITION);
      expect(merged[0].nodes.length).toBe(1);
      expect(merged[0].outputVariables).toEqual(["a"]);
    });

    it("should attempt to handle computed setters without getters", () => {
      const { ast, program } = getSingleFileProgram(`
      class foo {
        // what is going on here?
        set a(v) { this._a = v }
      }
    `);
      const setter = (ast.statements[0] as ts.ClassDeclaration)
        .members[0] as ts.SetAccessorDeclaration;
      const outputSetter = transformSetter(setter, program);
      expect(outputSetter.result).toBeTruthy();
      const output = [outputSetter.result].filter((o): o is VxTransformResult<ts.Node> => !!o);
      const merged = mergeComputed(output, program);
      expect(merged.length).toBe(1);
      expect(merged[0].tag).toBe("Computed");
      expect(merged[0].reference).toBe(VxReferenceKind.VARIABLE_VALUE);
      expect(merged[0].kind).toBe(VxResultKind.COMPOSITION);
      expect(merged[0].nodes.length).toBe(1);
      expect(merged[0].outputVariables).toEqual(["a"]);
    });
  });
});

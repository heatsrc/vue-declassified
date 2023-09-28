import { describe, it, expect, vi } from "vitest";
import { transformLifecycleHooks } from "../LifecycleHooks.js";
import { VxReferenceKind, VxResultKind } from "@/types.js";
import { shouldBeTruthy } from "@test/customAssertions.js";
import { getSingleFileProgram } from "@/parser.js";
import ts from "typescript";

describe("LifecycleHooks", () => {
  it("should return false if the node is not a lifecycle hook", () => {
    const { ast, program } = getSingleFileProgram(`
      class foo {
        what() { console.log(1); }
      }
    `);
    const node = (ast.statements[0] as ts.ClassDeclaration).members[0] as ts.MethodDeclaration;
    const result = transformLifecycleHooks(node, program);
    expect(result.shouldContinue).toBe(true);
  });

  it("should return the body of the method if the lifecycle hook doesn't exist", () => {
    const { ast, program } = getSingleFileProgram(`
      class foo {
        created() { console.log(1); }
      }
    `);

    const node = (ast.statements[0] as ts.ClassDeclaration).members[0] as ts.MethodDeclaration;
    const output = transformLifecycleHooks(node, program);

    shouldBeTruthy(output);
    shouldBeTruthy(output.result);
    expect(output.shouldContinue).toBe(false);
    const result = output.result;
    expect(result.tag).toBe("LifeCycleHook");
    expect(result.kind).toBe(VxResultKind.COMPOSITION);
    expect(result.reference).toBe(VxReferenceKind.NONE);
    expect(result.nodes.length).toBe(1);
    shouldBeTruthy(result.nodes);
    expect((result.nodes[0] as any).expression.expression.expression.escapedText).toBe("console");
    expect(result.outputVariables).toMatchObject([]);
    expect(result.imports).toMatchObject([]);
  });

  it("should return a call expression if the lifecycle hook exists", () => {
    const { ast, program } = getSingleFileProgram(`
      class foo {
        mounted() { console.log(1); }
      }
    `);

    const node = (ast.statements[0] as ts.ClassDeclaration).members[0] as ts.MethodDeclaration;
    const output = transformLifecycleHooks(node, program);

    shouldBeTruthy(output);
    shouldBeTruthy(output.result);
    expect(output.shouldContinue).toBe(false);
    const results = output.result;
    shouldBeTruthy(results);
    expect(results.tag).toBe("LifeCycleHook");
    expect(results.kind).toBe(VxResultKind.COMPOSITION);
    expect(results.reference).toBe(VxReferenceKind.NONE);
    expect(results.nodes.length).toBe(1);
    expect((results.nodes[0] as any).expression.expression.escapedText).toBe("onMounted");
    expect(results.outputVariables).toMatchObject(["onMounted"]);
    expect(results.imports).toMatchObject([{ named: ["onMounted"], external: "vue" }]);
  });
});

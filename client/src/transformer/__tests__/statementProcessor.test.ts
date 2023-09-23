import { VxClassMemberTransforms, VxClassTransforms, VxResultKind } from "@/types.js";
import { shouldBeDefined, shouldBeTruthy } from "@test/customAssertions.js";
import { afterEach } from "node:test";
import ts, { factory as f } from "typescript";
import { Mock, beforeEach, describe, expect, it, vi } from "vitest";
import { processClassDecorator, processClassMember } from "../statementsProcessor.js";
const u = undefined;

describe("statementProcessor", () => {
  let propertyAssignmentTransform: Mock<any, any>;
  let methodDeclarationTransform: Mock<any, any>;
  let identifierTransform: Mock<any, any>;
  let heritageClauseTransform: Mock<any, any>;
  let propertyDeclarationTransform: Mock<any, any>;
  let getAccessorTransform: Mock<any, any>;
  let setAccessorTransform: Mock<any, any>;
  let decoratorTransforms: VxClassTransforms[ts.SyntaxKind.Decorator];
  let memberTransforms: VxClassMemberTransforms;

  // Some helpers to make the tests more readable
  const createId = (name: string) => f.createIdentifier(name);
  const emptyReturn = () =>
    f.createBlock([f.createReturnStatement(f.createObjectLiteralExpression([]))]);
  const methodDec = (name: ts.Identifier) =>
    f.createMethodDeclaration(u, u, name, u, u, [], u, emptyReturn());
  const objectLiteralExpr = (props: ts.ObjectLiteralElementLike[]) =>
    f.createObjectLiteralExpression(props);
  const callExpr = (name: ts.Identifier, args: ts.Expression[]) =>
    f.createCallExpression(name, u, args);

  beforeEach(() => {
    propertyAssignmentTransform = vi.fn().mockReturnValue("PropertyAssignment");
    methodDeclarationTransform = vi.fn().mockReturnValue("MethodDeclaration");
    identifierTransform = vi.fn().mockReturnValue("Identifier");
    heritageClauseTransform = vi.fn().mockReturnValue("HeritageClause");
    propertyDeclarationTransform = vi.fn().mockReturnValue("PropertyDeclaration");
    getAccessorTransform = vi.fn().mockReturnValue("GetAccessor");
    setAccessorTransform = vi.fn().mockReturnValue("SetAccessor");

    memberTransforms = {
      [ts.SyntaxKind.Identifier]: [identifierTransform],
      [ts.SyntaxKind.HeritageClause]: [heritageClauseTransform],
      [ts.SyntaxKind.PropertyDeclaration]: [propertyDeclarationTransform],
      [ts.SyntaxKind.GetAccessor]: [getAccessorTransform],
      [ts.SyntaxKind.SetAccessor]: [setAccessorTransform],
      [ts.SyntaxKind.MethodDeclaration]: [methodDeclarationTransform],
    };

    decoratorTransforms = {
      [ts.SyntaxKind.PropertyAssignment]: [propertyAssignmentTransform],
      [ts.SyntaxKind.MethodDeclaration]: [methodDeclarationTransform],
    };
  });

  afterEach(() => vi.resetAllMocks());

  describe("processClassMember", () => {
    it("should return false if node is not transformable", () => {
      const expr = callExpr(createId("foo"), []);

      const result = processClassMember(expr, {} as any, memberTransforms);

      expect(result).toEqual(false);
      Object.values(memberTransforms).forEach((transform) => {
        expect(transform[0]).not.toHaveBeenCalled();
      });
    });

    const heritageClause = f.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
      f.createExpressionWithTypeArguments(createId("Vue"), u),
    ]);
    const identifier = createId("a");
    const propertyDecl = f.createPropertyDeclaration(u, createId("a"), u, u, f.createTrue());
    const getAccessor = f.createGetAccessorDeclaration(u, createId("a"), [], u, f.createBlock([]));
    const setAccessor = f.createSetAccessorDeclaration(u, createId("a"), [], f.createBlock([]));
    const methodDecl = methodDec(createId("foo"));
    type MemberTransformTestData = {
      name: string;
      syntaxKind: keyof VxClassMemberTransforms;
      node: ts.Expression;
    };
    it.each`
      name                     | syntaxKind                           | node
      ${"Identifier"}          | ${ts.SyntaxKind.Identifier}          | ${identifier}
      ${"HeritageClause"}      | ${ts.SyntaxKind.HeritageClause}      | ${heritageClause}
      ${"PropertyDeclaration"} | ${ts.SyntaxKind.PropertyDeclaration} | ${propertyDecl}
      ${"GetAccessor"}         | ${ts.SyntaxKind.GetAccessor}         | ${getAccessor}
      ${"SetAccessor"}         | ${ts.SyntaxKind.SetAccessor}         | ${setAccessor}
      ${"MethodDeclaration"}   | ${ts.SyntaxKind.MethodDeclaration}   | ${methodDecl}
    `(
      "It should process transforms for: $name",
      ({ name, syntaxKind, node }: MemberTransformTestData) => {
        const result = processClassMember(node, {} as any, memberTransforms);

        shouldBeDefined(result);
        expect(result).toEqual([name]);
        expect(memberTransforms[syntaxKind][0]).toHaveBeenCalledWith(node, expect.anything());
        Object.values(memberTransforms).forEach((transform) => {
          if ((result[0] as any) !== name) expect(transform[0]).not.toHaveBeenCalled();
        });
      },
    );
  });

  describe.each([["Component"], ["Options"]])("processClassDecorator (@%s)", (decoratorName) => {
    const decoratorId = createId(decoratorName);

    it("should return false decorator without call expression", async () => {
      const decorator = f.createDecorator(decoratorId);

      const result = processClassDecorator(decorator, {} as any, decoratorTransforms);

      expect(result).toEqual(false);
      expect(propertyAssignmentTransform).not.toHaveBeenCalled();
      expect(methodDeclarationTransform).not.toHaveBeenCalled();
    });

    it("should return false decorator with empty call expression", async () => {
      const decorator = f.createDecorator(callExpr(decoratorId, []));

      const result = processClassDecorator(decorator, {} as any, decoratorTransforms);

      expect(result).toEqual(false);
      expect(propertyAssignmentTransform).not.toHaveBeenCalled();
      expect(methodDeclarationTransform).not.toHaveBeenCalled();
    });

    it("should return empty array if empty option object", () => {
      const decorator = f.createDecorator(callExpr(decoratorId, [objectLiteralExpr([])]));

      const result = processClassDecorator(decorator, {} as any, decoratorTransforms);

      expect(result).toEqual([]);
      expect(propertyAssignmentTransform).not.toHaveBeenCalled();
      expect(methodDeclarationTransform).not.toHaveBeenCalled();
    });

    it("should throw if decorator call expression is not an object literal", () => {
      const decorator = f.createDecorator(callExpr(decoratorId, [f.createStringLiteral("foo")]));

      expect(() => processClassDecorator(decorator, {} as any, decoratorTransforms)).toThrowError(
        `Vue class decorator argument must be an object literal expression`,
      );
    });

    it("should convert method declarations in options object", () => {
      const method = methodDec(createId("foo"));
      const decorator = f.createDecorator(callExpr(decoratorId, [objectLiteralExpr([method])]));

      const result = processClassDecorator(decorator, {} as any, decoratorTransforms);

      expect(result).toEqual(["MethodDeclaration"]);
      expect(methodDeclarationTransform).toHaveBeenCalledWith(method, expect.anything());
      expect(propertyAssignmentTransform).not.toHaveBeenCalled();
    });

    it("should convert property assignments in options object", () => {
      const property = f.createPropertyAssignment(createId("methods"), objectLiteralExpr([]));
      const decorator = f.createDecorator(callExpr(decoratorId, [objectLiteralExpr([property])]));

      const result = processClassDecorator(decorator, {} as any, decoratorTransforms);

      expect(result).toEqual(["PropertyAssignment"]);
      expect(methodDeclarationTransform).not.toHaveBeenCalled();
      expect(propertyAssignmentTransform).toHaveBeenCalledWith(property, expect.anything());
    });

    it("should attempt to handle unknown SyntaxKinds in options object", () => {
      const getter = f.createGetAccessorDeclaration(u, createId("foo"), [], u, f.createBlock([]));
      const decorator = f.createDecorator(callExpr(decoratorId, [objectLiteralExpr([getter])]));

      const result = processClassDecorator(decorator, {} as any, decoratorTransforms);

      shouldBeTruthy(result);
      expect(result.length).toBe(1);
      expect(result[0].kind).toBe(VxResultKind.MACRO);
      expect(result[0].tag).toBe("InheritOptions");
      expect(result[0].nodes.length).toBe(1);
      expect(propertyAssignmentTransform).not.toHaveBeenCalled();
      expect(methodDeclarationTransform).not.toHaveBeenCalled();
    });
  });
});

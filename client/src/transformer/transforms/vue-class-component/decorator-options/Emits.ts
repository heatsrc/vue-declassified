import { VxResultToMacro, VxTransform } from "@/types";
import ts from "typescript";
import { instanceDependencies } from "../../utils/instancePropertyAccess";

export const transformOptionsEmits: VxTransform<ts.PropertyAssignment> = (emitsOption) => {
  if (emitsOption.name.getText() !== "emits") return { shouldContinue: true };

  const emitsOptions = emitsOption.initializer;
  if (!ts.isArrayLiteralExpression(emitsOptions))
    throw new Error("[vue-class-component] emits option should be string[]");

  const elements = emitsOptions.elements.map((el) => {
    const name = ts.isStringLiteral(el) ? el.text : el.getText();
    return [name, getUnknownArgs()] as [propId: string, type: ts.TupleTypeNode];
  });
  const arrayLit = ts.factory.createArrayLiteralExpression(emitsOptions.elements);
  const getDependency = instanceDependencies.get("$emit");
  if (!getDependency) throw new Error("[vue-class-component] $emit dependency not found");
  const defineEmitsResult = getDependency() as VxResultToMacro;
  defineEmitsResult.typeProperties.push(...elements);

  return {
    shouldContinue: false,
    result: defineEmitsResult,
  };
};

function getUnknownArgs() {
  return ts.factory.createTupleTypeNode([
    ts.factory.createNamedTupleMember(
      ts.factory.createToken(ts.SyntaxKind.DotDotDotToken),
      ts.factory.createIdentifier("args"),
      undefined,
      ts.factory.createArrayTypeNode(
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
      ),
    ),
  ]);
}

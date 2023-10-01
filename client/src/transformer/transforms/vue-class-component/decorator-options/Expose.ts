import { createIdentifier } from "@/helpers/tsHelpers.js";
import { VxReferenceKind, VxResultKind, VxTransform } from "@/types.js";
import ts from "typescript";

export const transformOptionsExpose: VxTransform<ts.PropertyAssignment> = (exposeOption) => {
  if (exposeOption.name.getText() !== "expose") return { shouldContinue: true };

  const exposeOptions = exposeOption.initializer;
  if (!ts.isArrayLiteralExpression(exposeOptions))
    throw new Error("Invalid Option-Data: expose option should be string[]");

  const properties = exposeOptions.elements.map((el) => {
    if (!ts.isStringLiteral(el))
      throw new Error("Invalid Option-Data: expose option should be string[]");

    const name = createIdentifier(el.text);
    const property = ts.factory.createShorthandPropertyAssignment(name);
    return property;
  });

  const objLit = ts.factory.createObjectLiteralExpression(properties);
  const defineExpose = ts.factory.createIdentifier("defineExpose");
  const callExpr = ts.factory.createCallExpression(defineExpose, [], [objLit]);
  const expressionStatement = ts.factory.createExpressionStatement(callExpr);

  return {
    shouldContinue: false,
    result: {
      kind: VxResultKind.COMPOSITION,
      tag: `SortLast:100:Expose`,
      imports: [],
      outputVariables: [],
      reference: VxReferenceKind.NONE,
      nodes: [expressionStatement],
    },
  };
};

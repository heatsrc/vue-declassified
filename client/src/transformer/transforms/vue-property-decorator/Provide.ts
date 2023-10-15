import { createCallExpression, createIdentifier, getDecorators } from "@/helpers/tsHelpers.js";
import { namedImports } from "@/helpers/utils.js";
import { registerDecorator } from "@/transformer/registry.js";
import { VxReferenceKind, VxResultKind, VxTransform } from "@/types.js";
import ts from "typescript";

const DECORATOR = "Provide";

export const transformDecoratorProvide: VxTransform<ts.PropertyDeclaration> = (node, program) => {
  if (!ts.isPropertyDeclaration(node)) return { shouldContinue: true };

  const decorators = getDecorators(node, DECORATOR);

  if (!decorators || decorators.length <= 0) return { shouldContinue: true };
  if (decorators.length > 1)
    throw new Error(
      `[vue-class-component] Duplicate @${DECORATOR} decorators for ${node.name.getText()}`,
    );

  registerDecorator(DECORATOR);
  const decorator = decorators[0];

  let decoratorArg: ts.Expression | undefined;
  if (ts.isCallExpression(decorator.expression)) decoratorArg = decorator.expression.arguments[0];

  if (decoratorArg && !ts.isStringLiteral(decoratorArg))
    throw new Error(`[vue-class-component] Expected @${DECORATOR} to be a string literal`);

  const provideId = decoratorArg ?? ts.factory.createStringLiteral(node.name.getText());
  const provideValue = createIdentifier(node.name.getText());
  // Using `this?.` as a signifier we don't want to convert ref to .value
  const providePropAccess = ts.factory.createPropertyAccessChain(
    ts.factory.createThis(),
    ts.factory.createToken(ts.SyntaxKind.QuestionDotToken),
    provideValue,
  );
  const provideExpr = createCallExpression("provide", undefined, [provideId, providePropAccess]);

  return {
    // we want to continue so the property is declared
    shouldContinue: true,
    result: {
      kind: VxResultKind.COMPOSITION,
      tag: "Provide",
      imports: namedImports(["provide"]),
      outputVariables: [],
      reference: VxReferenceKind.NONE,
      nodes: [provideExpr],
    },
  };
};

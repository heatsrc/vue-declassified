import { createIdentifier, getDecorators } from "@/helpers/tsHelpers.js";
import { registerDecorator } from "@/transformer/registry.js";
import { VxReferenceKind, VxResultKind, VxTransform } from "@/types.js";
import ts from "typescript";
import { getWatchCalls } from "../utils/getWatchCall.js";

const DECORATOR = "Watch";

export const transformWatchDecorator: VxTransform<ts.MethodDeclaration> = (watchFn, program) => {
  if (!ts.isMethodDeclaration(watchFn)) return { shouldContinue: true };

  const watchFnName = watchFn.name.getText();
  const decorators = getDecorators(watchFn, DECORATOR);

  if (!decorators || decorators.length <= 0) return { shouldContinue: true };
  registerDecorator(DECORATOR);

  const nodes = decorators.map((decorator) => {
    if (!ts.isCallExpression(decorator.expression))
      throw getError(watchFnName, `to be a call expression`);
    if (!ts.isStringLiteral(decorator.expression.arguments[0]))
      throw getError(watchFnName, `to be called with a string as first argument`);

    const watchSource = decorator.expression.arguments[0].text;
    const watchHandler = createIdentifier(watchFnName);
    const watchExpression = getWatchCalls(watchSource, [watchHandler]);
    return watchExpression[0];
  });

  return {
    // Carry on so the method can be transformed
    shouldContinue: true,
    result: {
      tag: `SortLast:90:Watch`,
      reference: VxReferenceKind.NONE,
      kind: VxResultKind.COMPOSITION,
      imports: [],
      outputVariables: [],
      nodes,
    },
  };
};

function getError(propName: string, err: string) {
  return new Error(`[vue-property-decorator] Expected @${DECORATOR} for ${propName} ${err}`);
}
import { namedImports } from "@/helpers/utils.js";
import {
  convertInitializerToWatchHandlers,
  getWatchCalls,
} from "@/transformer/transforms/utils/getWatchCall.js";
import { VxReferenceKind, VxResultKind, VxTransform } from "@/types.js";
import ts from "typescript";

export const transformOptionsWatch: VxTransform<ts.PropertyAssignment> = (watchOption, program) => {
  if (watchOption.name.getText() !== "watch") return { shouldContinue: true };

  const watchOptionObject = watchOption.initializer;

  if (!ts.isObjectLiteralExpression(watchOptionObject))
    throw new Error("[vue-class-component] watch option should be an object");

  const nodes = watchOptionObject.properties.reduce((acc, prop) => {
    if (!ts.isPropertyAssignment(prop)) return acc;

    let watchSource = prop.name.getText();
    if (ts.isStringLiteral(prop.name)) watchSource = prop.name.text;
    const watchHandlers = convertInitializerToWatchHandlers(prop.initializer);
    const watchCalls = getWatchCalls(watchSource, watchHandlers);

    acc.push(...watchCalls);
    return acc;
  }, [] as ts.ExpressionStatement[]);

  return {
    shouldContinue: false,
    result: {
      kind: VxResultKind.COMPOSITION,
      tag: `SortLast:90:Watch`,
      imports: namedImports(["watch"]),
      outputVariables: [],
      reference: VxReferenceKind.NONE,
      nodes,
    },
  };
};

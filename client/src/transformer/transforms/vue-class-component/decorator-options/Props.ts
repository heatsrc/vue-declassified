import { VxReferenceKind, VxResultKind, VxResultToMacro, VxTransform } from "@/types.js";
import ts from "typescript";
import { processPropsMetadata } from "../../utils/processPropsMetadata.js";
import { unknownKeyword } from "./ctorToType.js";

export const transformOptionsProps: VxTransform<ts.PropertyAssignment> = (propsOption, program) => {
  if (propsOption.name.getText() !== "props") return { shouldContinue: true };

  let defaults: ts.PropertyAssignment[] = [];
  let typeProperties: VxResultToMacro["typeProperties"] = [];
  const results: VxResultToMacro<ts.PropertyAssignment>[] = [];
  const propsOptionValue = propsOption.initializer;

  if (ts.isArrayLiteralExpression(propsOptionValue)) {
    typeProperties = propsOptionValue.elements
      .filter((expr): expr is ts.StringLiteral => expr.kind === ts.SyntaxKind.StringLiteral)
      .map((attr) => [attr.text, unknownKeyword()]);
  } else if (ts.isObjectLiteralExpression(propsOptionValue)) {
    const propMetadata = processPropsMetadata(propsOptionValue.properties);

    typeProperties = [...propMetadata].map(([k, v]) => [k, v.type, v.optional]);
    defaults = [...propMetadata]
      .filter(([k, v]) => !!v.default)
      .map(([k, v]) => {
        let defVal: ts.Expression = v.default!;
        if (
          v.default &&
          (ts.isObjectLiteralExpression(v.default) || ts.isArrayLiteralExpression(v.default))
        ) {
          const u = undefined;
          const expr = ts.factory.createParenthesizedExpression(v.default);
          const rocket = ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken);
          const arrowFn = ts.factory.createArrowFunction(u, u, [], u, rocket, expr);
          defVal = arrowFn;
        }

        return ts.factory.createPropertyAssignment(k, defVal);
      });
  } else {
    throw new Error("Invalid props declaration, expecting `string[] | Object`");
  }

  results.push({
    kind: VxResultKind.MACRO,
    tag: `Macro-defineProps`,
    imports: [],
    outputVariables: ["props"],
    reference: VxReferenceKind.DEFINABLE_VARIABLE,
    nodes: defaults ?? [],
    typeProperties,
  });

  return {
    shouldContinue: false,
    result: results,
  };
};

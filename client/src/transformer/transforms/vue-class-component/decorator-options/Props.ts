import { VxReferenceKind, VxResultKind, VxResultToMacro, VxTransform } from "@/types.js";
import { cloneNode } from "ts-clone-node";
import ts from "typescript";
import { ctorToType, unknownKeyword } from "./ctorToType.js";

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
    const propMetadata = processPropsObjectElements(propsOptionValue.properties);

    typeProperties = [...propMetadata].map(([k, v]) => [k, v.type, v.optional]);
    defaults = [...propMetadata]
      .filter(([k, v]) => !!v.default)
      .map(([k, v]) => ts.factory.createPropertyAssignment(k, v.default!));
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

/**
 * Processes object literal elements and returns a metadata of the props
 *
 * Properties can be either another Object Literal or a Property Assignment to a
 * Data type constructor object (e.g., String)
 *
 * @example
 *    props: ["a", "b", "c"],
 *    // or
 *    props: { a: String, b: Object, c: Boolean },
 *    // or
 *    props: {
 *      a: {
 *        type: String,
 *        required: true,
 *      },
 *      b: {
 *        type: Object,
 *        required: false,
 *        default: () => ({})
 *      },
 *      c: {
 *        type: Boolean,
 *        required: false,
 *        default: false
 *      }
 *    }
 * @param properties
 * @returns
 */
function processPropsObjectElements(properties: ts.NodeArray<ts.ObjectLiteralElementLike>) {
  return properties.reduce((acc, propKey) => {
    if (!ts.isPropertyAssignment(propKey)) return acc;

    const propName = propKey.name.getText();
    const propValue = propKey.initializer;

    if (!acc.has(propName)) acc.set(propName, { type: unknownKeyword(), optional: false });
    const metadata = acc.get(propName)!;

    if (ts.isIdentifier(propValue)) {
      const getTypeNode = ctorToType.get(propValue.getText());
      const type = getTypeNode ? getTypeNode() : unknownKeyword();
      metadata.type = type;
      return acc;
    }

    if (!ts.isObjectLiteralExpression(propValue)) return acc;

    propValue.properties.forEach((datum) => {
      if (!datum?.name || !ts.isPropertyAssignment(datum)) return;
      const mName = datum.name.getText();
      if (mName === "type") {
        const getTypeNode = ctorToType.get(datum.initializer.getText());
        if (getTypeNode) metadata.type = getTypeNode();
      }

      if (mName === "required" && datum.initializer.kind === ts.SyntaxKind.FalseKeyword) {
        metadata.optional = true;
      }

      if (mName === "default") {
        metadata.default = cloneNode(datum.initializer);
      }
    });
    return acc;
  }, new Map<string, { type: ts.TypeNode; optional: boolean; default?: ts.Expression }>());
}

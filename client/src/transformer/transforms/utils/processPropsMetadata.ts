import { cloneNode } from "ts-clone-node";
import ts from "typescript";
import { ctorToType, unknownKeyword } from "../vue-class-component/decorator-options/ctorToType.js";

type PropMetadata = {
  type: ts.TypeNode;
  optional?: boolean;
  default?: ts.Expression;
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
export function processPropsMetadata(properties: ts.NodeArray<ts.ObjectLiteralElementLike>) {
  return properties.reduce((acc, propKey) => {
    if (!ts.isPropertyAssignment(propKey)) return acc;

    const propName = propKey.name.getText();
    const propValue = propKey.initializer;

    if (!acc.has(propName)) acc.set(propName, { type: unknownKeyword(), optional: false });
    let metadata = acc.get(propName)!;

    if (ts.isIdentifier(propValue)) {
      const getTypeNode = ctorToType.get(propValue.getText());
      const type = getTypeNode ? getTypeNode() : unknownKeyword();
      metadata.type = type;
      return acc;
    }

    if (!ts.isObjectLiteralExpression(propValue)) return acc;

    const m = processPropMetadata(propValue.properties);
    Object.assign(metadata, m);

    return acc;
  }, new Map<string, PropMetadata>());
}

export function processPropMetadata(metadata: ts.NodeArray<ts.ObjectLiteralElement>) {
  const result: PropMetadata = { type: unknownKeyword() };
  metadata.forEach((datum) => {
    if (!datum?.name || !ts.isPropertyAssignment(datum)) return;
    const mName = datum.name.getText();
    const initializer = datum.initializer;
    if (mName === "type") {
      if (ts.isArrayLiteralExpression(initializer)) {
        const types = initializer.elements.map((e) => {
          if (!ts.isIdentifier(e)) return unknownKeyword();
          const getTypeNode = ctorToType.get(e.getText());
          if (!getTypeNode) return unknownKeyword();
          return getTypeNode();
        });
        result.type = ts.factory.createUnionTypeNode(types);
      } else {
        const getTypeNode = ctorToType.get(initializer.getText());
        if (getTypeNode) result.type = getTypeNode();
      }
    }

    if (mName === "required" && datum.initializer.kind === ts.SyntaxKind.FalseKeyword) {
      result.optional = true;
    }

    if (mName === "default") {
      result.default = cloneNode(datum.initializer);
    }
  });
  return result;
}

import { createIdentifier } from "@/helpers/tsHelpers.js";
import { traverseNode } from "@/helpers/utils.js";
import { VxResultKind, VxTransform, VxTransformResult } from "@/types.js";
import ts from "typescript";
import {
  instanceDependencies,
  tryGettingEventName,
  tryToFindType,
} from "../utils/instancePropertyAccess.js";
/**
 * Inspects a nodes children for instance properties (e.g., `this.$store`) and
 * creates a transform result for each so that they are declared. Some instance
 * properties are global and aren't required to be declared in the options so
 * it's possible these won't be caught by the decorator options transforms.
 * @param node
 * @param program
 * @returns
 */
export const transformDefinables: VxTransform<
  | ts.MethodDeclaration
  | ts.PropertyDeclaration
  | ts.GetAccessorDeclaration
  | ts.SetAccessorDeclaration
> = (node, program) => {
  const result: VxTransformResult<ts.Node>[] = [];

  traverseNode(node, (child) => {
    if (!ts.isPropertyAccessExpression(child)) return;
    if (child.expression.kind !== ts.SyntaxKind.ThisKeyword) return;

    const depName = child.name.text;
    if (!instanceDependencies.has(depName)) return;
    const dependency = instanceDependencies.get(depName);
    // TS doesn't type narrow Maps :(
    if (!dependency) return;

    // For most macros we will not be able to infer the type of the property at this stage
    if (ts.isPropertyAccessExpression(child.parent) && dependency.kind === VxResultKind.MACRO) {
      const propertyName = child.parent.name.text;
      const propType = ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword);
      dependency.typeProperties.push([propertyName, propType]);

      // For $emit we might be able to infer the type of the event types
    } else if (ts.isCallExpression(child.parent) && dependency.kind === VxResultKind.MACRO) {
      const parent = child.parent;
      const [firstArg, ...args] = parent.arguments;
      let propertyName = `DECLASS_TODO $emit has unexpected first argument: ${firstArg.getText()}`;
      if (ts.isIdentifier(firstArg)) {
        propertyName = tryGettingEventName(firstArg, program);
      } else if (ts.isStringLiteralLike(firstArg)) {
        propertyName = firstArg.text;
      }

      const tupleArgs = args.reduce((acc, arg) => {
        const argName = createIdentifier(arg.getText());
        const tupleType = tryToFindType(arg, program);
        const tupleElement = ts.factory.createNamedTupleMember(
          undefined,
          argName,
          undefined,
          tupleType,
        );
        acc.push(tupleElement);
        return acc;
      }, [] as ts.NamedTupleMember[]);

      const tupleLiteral = ts.factory.createTupleTypeNode(tupleArgs);
      dependency.typeProperties.push([propertyName, tupleLiteral]);
    }

    result.push(dependency);
  });
  // Unlike most transforms we don't want to stop here.
  return {
    shouldContinue: true,
    result,
  };
};

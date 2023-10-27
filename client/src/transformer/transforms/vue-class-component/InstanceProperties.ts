import { createIdentifier } from "@/helpers/tsHelpers.js";
import { traverseNode } from "@/helpers/utils.js";
import { VxResultKind, VxTransform, VxTransformResult } from "@/types.js";
import ts from "typescript";
import { instanceDependencies, tryGettingEventName } from "../utils/instancePropertyAccess.js";
import { tryToFindType } from "../utils/tryToFindType.js";
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
    const getDependency = instanceDependencies.get(depName);
    if (!getDependency) return;
    const dependency = getDependency();
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
      let propertyName = `[VUEDC_TODO] $emit has unexpected first argument: ${firstArg.getText()}`;
      if (ts.isIdentifier(firstArg)) {
        propertyName = tryGettingEventName(firstArg, program);
      } else if (ts.isStringLiteralLike(firstArg)) {
        propertyName = firstArg.text;
      }

      let argCount = 0;
      const tupleArgs = args.reduce((acc, arg) => {
        let argN = arg.getText();
        if (ts.isPropertyAccessExpression(arg)) {
          argN = `_${arg.name.text}${argCount}`;
          argCount += 1;
        }
        let tupleType: ts.TypeNode;

        if (ts.isObjectLiteralExpression(arg)) {
          const types = arg.properties.reduce((acc, prop) => {
            if (!prop.name || !ts.isIdentifier(prop.name)) return acc;
            const propName = prop.name.getText();
            const propType = tryToFindType(prop.name, program);
            const propSig = ts.factory.createPropertySignature(
              undefined,
              propName,
              undefined,
              propType,
            );
            argN = `_payload${argCount}`;
            argCount += 1;
            acc.push(propSig);
            return acc;
          }, [] as ts.PropertySignature[]);
          tupleType = ts.factory.createTypeLiteralNode(types);
        } else if (ts.isArrayLiteralExpression(arg)) {
          const types = arg.elements.reduce((acc, prop) => {
            if (!prop || !ts.isIdentifier(prop)) return acc;
            const propType = tryToFindType(prop, program);
            const propMember = ts.factory.createNamedTupleMember(
              undefined,
              prop,
              undefined,
              propType,
            );
            argN = `_payload${argCount}`;
            argCount += 1;
            acc.push(propMember);
            return acc;
          }, [] as ts.NamedTupleMember[]);
          tupleType = ts.factory.createTupleTypeNode(types);
        } else {
          tupleType = tryToFindType(arg, program);
        }

        const argName = createIdentifier(argN);
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

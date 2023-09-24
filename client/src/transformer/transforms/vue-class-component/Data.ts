import { addTodoComment, copySyntheticComments, removeComments } from "@/helpers/comments.js";
import {
  createCallExpression,
  createConstStatement,
  createLetStatement,
  getDecoratorNames,
  isPrimitiveType,
} from "@/helpers/tsHelpers.js";
import { namedImports } from "@/helpers/utils.js";
import { VxReferenceKind, VxResultKind, VxTransform } from "@/types.js";
import ts from "typescript";

/**
 * Transforms basic data initialized properties into `reactive` or `ref`
 * variables. Uninitialized properties will be converted to `let` with no
 * assignment. This should be considered the default transform for data
 * properties and if any decorator is present a todo comment will be added.
 *
 * @param node
 * @param program
 * @returns
 */
export const transformData: VxTransform<ts.PropertyDeclaration> = (node, program) => {
  const variableName = node.name.getText();
  const checker = program.getTypeChecker();
  let tag: string = "Data-nonreactive";
  let variableAssignment: ts.VariableStatement;
  let isRef = false;
  let callName: string | undefined;

  if (!node.initializer) {
    // an uninitialized data property on a class is considered an non-reactive variable
    variableAssignment = createLetStatement(variableName, undefined, node.type);
  } else {
    isRef = isPrimitiveType(checker.getTypeAtLocation(node.initializer));
    tag = isRef ? "Data-ref" : "Data-reactive";
    callName = isRef ? "ref" : "reactive";
    const callExpr = createCallExpression(callName, node.type, [removeComments(node.initializer)]);
    variableAssignment = createConstStatement(variableName, callExpr);
  }

  // If we got here and there are decorators, it means we couldn't transform
  // this node, we need to add a todo comment
  const decorators = getDecoratorNames(node);
  if (decorators.length > 0) {
    variableAssignment = addTodoComment(
      variableAssignment,
      `Encountered unsupported Decorator(s): "${node.getText()}")`,
    );
  }

  return {
    tag,
    kind: VxResultKind.COMPOSITION,
    imports: callName ? namedImports([callName]) : [],
    reference: isRef ? VxReferenceKind.VARIABLE_VALUE : VxReferenceKind.VARIABLE,
    outputVariables: [variableName],
    nodes: [copySyntheticComments(variableAssignment, node)],
  };
};

import { addTodoComment, copySyntheticComments } from "@/helpers/comments.js";
import {
  createArrowFunction,
  createConstStatement,
  getDecoratorNames,
} from "@/helpers/tsHelpers.js";
import { VxReferenceKind, VxResultKind, VxTransform } from "@/types.js";
import ts from "typescript";

export const transformMethod: VxTransform<ts.MethodDeclaration> = (node, program) => {
  const methodName = node.name.getText();
  const outputMethod = createArrowFunction(node);
  let methodConstStatement = createConstStatement(methodName, outputMethod);

  const decorators = getDecoratorNames(node);
  if (decorators.length > 0) {
    methodConstStatement = addTodoComment(
      methodConstStatement,
      `Encountered unsupported decorator(s): ${decorators.map((d) => `"@${d}"`).join(", ")}`,
    );
  }

  methodConstStatement = copySyntheticComments(methodConstStatement, node);

  return {
    tag: "Method",
    reference: VxReferenceKind.VARIABLE,
    kind: VxResultKind.COMPOSITION,
    imports: [],
    outputVariables: [methodName],
    nodes: [methodConstStatement],
  };
};

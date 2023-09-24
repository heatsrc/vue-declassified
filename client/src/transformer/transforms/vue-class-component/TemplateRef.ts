import { addTodoComment, copySyntheticComments } from "@/helpers/comments.js";
import { createCallExpression, createConstStatement } from "@/helpers/tsHelpers.js";
import { namedImports } from "@/helpers/utils.js";
import { VxReferenceKind, VxResultKind, VxTransform } from "@/types.js";
import ts from "typescript";

export const transformTemplateRef: VxTransform<ts.PropertyDeclaration> = (node) => {
  const signatures = getPropertySignatures(node);
  if (!signatures) return false;

  const [names, refs] = signatures.reduce(
    (acc, signature) => {
      const [name, statement] = getVarStatement(signature);
      acc[0].push(name);
      acc[1].push(statement);
      return acc;
    },
    [[], []] as [string[], ts.Statement[]],
  );

  return {
    tag: "TemplateRef",
    kind: VxResultKind.COMPOSITION,
    reference: VxReferenceKind.VARIABLE,
    imports: namedImports(["ref"]),
    outputVariables: names,
    nodes: refs,
  };
};

function getPropertySignatures(node: ts.PropertyDeclaration) {
  if (node.name.getText() !== "$refs") return false;

  const typeLiteral = node
    .getChildren()
    .find((child): child is ts.TypeLiteralNode => child.kind === ts.SyntaxKind.TypeLiteral);

  if (!typeLiteral) return false;

  const signatures = typeLiteral.members.filter(
    (member): member is ts.PropertySignature => member.kind === ts.SyntaxKind.PropertySignature,
  );

  if (!signatures.length) return false;

  return signatures;
}

function getVarStatement(signature: ts.PropertySignature) {
  const name = signature.name.getText();
  const refType = signature.type ? signature.type : undefined;
  const callExpr = createCallExpression("ref", refType, undefined);
  let refConstStatement = createConstStatement(name, callExpr);

  refConstStatement = addTodoComment(
    refConstStatement,
    "Check for potential naming collisions from `$refs` conversion.",
  );

  return [name, copySyntheticComments(refConstStatement, signature)] as const;
}

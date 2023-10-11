import { addTodoComment, copySyntheticComments } from "@/helpers/comments.js";
import { createCallExpression, createConstStatement } from "@/helpers/tsHelpers.js";
import { namedImports } from "@/helpers/utils.js";
import { VxReferenceKind, VxResultKind, VxTransform } from "@/types.js";
import ts from "typescript";

/**
 * Transforms `$refs` properties into `ref` variables. Because this is
 * extracting properties from a type literal and creating variables on the
 * script setup body it is possible this will cause naming collisions.
 *
 * @param node
 * @returns
 */
export const transformTemplateRef: VxTransform<ts.PropertyDeclaration> = (node) => {
  const signatures = getPropertySignatures(node);
  if (!signatures) return { shouldContinue: true };

  const [names, refs] = signatures.reduce(
    (acc, signature) => {
      const [name, statement] = getVarStatement(signature);
      acc[0].push(name);
      acc[1].push(statement);
      return acc;
    },
    [[], []] as [string[], ts.Statement[]],
  );

  if (refs.length > 0) copySyntheticComments(refs[0], node);

  return {
    shouldContinue: false,
    result: {
      tag: "TemplateRef",
      kind: VxResultKind.COMPOSITION,
      reference: VxReferenceKind.VARIABLE_VALUE,
      imports: namedImports(["ref"]),
      outputVariables: names,
      nodes: refs,
    },
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
    `Check for potential naming collisions from '$refs.${name}' conversion.`,
  );

  return [name, refConstStatement] as const;
}

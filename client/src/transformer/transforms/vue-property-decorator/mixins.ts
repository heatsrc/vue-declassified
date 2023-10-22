import { getImportNameOverride } from "@/registry";
import { VxTransform } from "@/types";
import ts from "typescript";

const CLAUSE = "mixins";

export const transformMixins: VxTransform<ts.HeritageClause> = (clause) => {
  if (!ts.isHeritageClause(clause)) return { shouldContinue: true };
  if (!isExtendsClause(clause)) return { shouldContinue: true };
  if (!clause.types) return { shouldContinue: true };

  const typeExpr = clause.types[0].expression;
  if (!ts.isCallExpression(typeExpr)) return { shouldContinue: true };

  const typeIdent = typeExpr.expression;
  if (!ts.isIdentifier(typeIdent)) return { shouldContinue: true };

  let clauseName = getImportNameOverride(CLAUSE) ?? CLAUSE;
  if (typeIdent.text !== clauseName) return { shouldContinue: true };

  const args = typeExpr.arguments;
  if (!args || args.length <= 0) return { shouldContinue: true };

  const
};

function isExtendsClause(clause: ts.HeritageClause) {
  return clause.token === ts.SyntaxKind.ExtendsKeyword;
}

import { getPrimitiveKeyword } from "@/helpers/tsHelpers";
import { cloneNode } from "ts-clone-node";
import ts from "typescript";

export function tryToFindType(
  node: ts.Expression | ts.PropertyDeclaration | ts.ParameterDeclaration,
  program: ts.Program,
) {
  // If current node is a Keyword Literal we can use default to that for now
  let keyword = getPrimitiveKeyword(node.kind);

  if (ts.isParameter(node) || ts.isVariableDeclaration(node) || ts.isPropertyDeclaration(node)) {
    if (node.type) return cloneNode(node.type);
    else if (node.initializer) {
      keyword = getPrimitiveKeyword(node.initializer.kind);
    }
  }

  const checker = program.getTypeChecker();
  const declaration = checker.getSymbolAtLocation(node)?.valueDeclaration;

  // Check the declaration of the node to see if it has a type
  if (
    declaration &&
    (ts.isParameter(declaration) ||
      ts.isVariableDeclaration(declaration) ||
      ts.isAccessor(declaration))
  ) {
    if (declaration.type) return cloneNode(declaration.type);
    else if (!ts.isAccessor(declaration) && declaration.initializer) {
      keyword = getPrimitiveKeyword(declaration.initializer.kind);
    }
  }

  // keyword falls back to `unknown` is all else fails.
  const keywordType = ts.factory.createKeywordTypeNode(keyword);
  return keywordType;
}

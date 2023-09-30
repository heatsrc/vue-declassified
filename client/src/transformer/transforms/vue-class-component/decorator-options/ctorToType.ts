import ts from "typescript";

const u = undefined;
export const unknownKeyword = () => createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword);
const {
  createKeywordTypeNode,
  createTypeReferenceNode,
  createArrayTypeNode,
  createFunctionTypeNode,
  createParameterDeclaration,
  createToken,
  createIdentifier,
} = ts.factory;

export const ctorToType = new Map<string, () => ts.TypeNode>([
  ["String", () => createKeywordTypeNode(ts.SyntaxKind.StringKeyword)],
  ["Number", () => createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)],
  ["Boolean", () => createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)],
  ["Array", () => createArrayTypeNode(unknownKeyword())],
  ["Date", () => createTypeReferenceNode(createIdentifier("Date"))],
  ["Symbol", () => createKeywordTypeNode(ts.SyntaxKind.SymbolKeyword)],
  [
    "Function",
    () => {
      const dotDotDot = createToken(ts.SyntaxKind.DotDotDotToken);
      const argsId = createIdentifier("args");
      const type = createArrayTypeNode(unknownKeyword());
      const params = createParameterDeclaration(u, dotDotDot, argsId, u, type);
      return createFunctionTypeNode(u, [params], unknownKeyword());
    },
  ],
  [
    "Object",
    () => {
      const recordId = createIdentifier("Record");
      const stringKeyword = createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
      return createTypeReferenceNode(recordId, [stringKeyword, unknownKeyword()]);
    },
  ],
]);

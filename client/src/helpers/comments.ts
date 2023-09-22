import ts from "typescript";

export function addTodoComment(node: ts.Node, comment: string, multiline: boolean) {
  const kind = multiline
    ? ts.SyntaxKind.MultiLineCommentTrivia
    : ts.SyntaxKind.SingleLineCommentTrivia;
  return ts.addSyntheticLeadingComment(node, kind, comment, true);
}

export function prependSyntheticComments<T extends ts.Node>(node: T, copyNode: ts.Node): T {
  const fullText = copyNode.getSourceFile().getFullText();

  const comments = [
    ...getCommentRange(fullText, copyNode.pos, "Leading"),
    ...getCommentRange(fullText, copyNode.end, "Trailing"),
  ];
  comments.forEach(({ pos, end, kind, hasTrailingNewLine }) => {
    const comment = getCommentText(fullText, { pos, end });
    ts.addSyntheticLeadingComment(node, kind, comment, hasTrailingNewLine);
  });

  return node;
}

function getCommentRange(text: string, pos: number, type: "Leading" | "Trailing") {
  const method = `get${type}CommentRanges` as const;
  return ts[method](text, pos) || [];
}

function getCommentText(text: string, { pos, end }: { pos: number; end: number }) {
  return text
    .slice(pos, end)
    .replace(/\/\//g, "")
    .replace(/\/\*/g, "")
    .replace(/\*\//g, "")
    .replace(/ {2}\* ?/g, "* ")
    .replace(/ \*\//g, "*/")
    .replace(/ {2}$/g, "");
}

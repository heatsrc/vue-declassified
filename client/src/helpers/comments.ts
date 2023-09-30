import ts from "typescript";

export function addTodoComment<T extends ts.Node>(node: T, comment: string) {
  const todo = ` VUEDC_TODO: ${comment}`;
  return ts.addSyntheticLeadingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, todo, false);
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

export function copySyntheticComments<T extends ts.Node>(node: T, copyNode: ts.Node): T {
  const fullText = copyNode.getSourceFile().getFullText();
  const leadingComments = getLeadingComments(fullText, copyNode.pos);
  const trailingComments = getTrailingComments(fullText, copyNode.end);

  let result = node;
  for (const { pos, end, kind, hasTrailingNewLine } of leadingComments) {
    const text = getCommentText(fullText, { pos, end });
    result = ts.addSyntheticLeadingComment(result, kind, text, hasTrailingNewLine);
  }

  for (const { pos, end, kind, hasTrailingNewLine } of trailingComments) {
    const text = getCommentText(fullText, { pos, end });
    result = ts.addSyntheticTrailingComment(result, kind, text, hasTrailingNewLine);
  }

  return node;
}

export function setSyntheticComments<T extends ts.Node>(
  node: T,
  leading: ts.SynthesizedComment[] | undefined,
  trailing: ts.SynthesizedComment[] | undefined,
) {
  let nodeWithComments = ts.setSyntheticLeadingComments(node, leading);
  nodeWithComments = ts.setSyntheticTrailingComments(node, trailing);
  return nodeWithComments;
}

export function removeComments<T extends ts.Node>(node: T): T | ts.StringLiteral {
  if (!ts.isStringLiteral(node)) return node;
  return ts.factory.createStringLiteral(node.text);
}

function getLeadingComments(text: string, pos: number): ts.CommentRange[] {
  return getCommentRange(text, pos, "Leading");
}

function getTrailingComments(text: string, pos: number): ts.CommentRange[] {
  return getCommentRange(text, pos, "Trailing");
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

import { addTodoComment, copySyntheticComments, setSyntheticComments } from "@/helpers/comments.js";
import {
  createArrowFunction,
  createCallExpression,
  createConstStatement,
  createObjectLiteral,
} from "@/helpers/tsHelpers.js";
import { namedImports } from "@/helpers/utils.js";
import {
  VxPostProcessor,
  VxReferenceKind,
  VxResultKind,
  VxTransform,
  VxTransformResult,
} from "@/types.js";
import ts from "typescript";

/**
 * Transforms get accessors in an arrow function to be merged with corresponding setter, if found, later.
 */
export const transformGetter: VxTransform<ts.GetAccessorDeclaration> = transformAccessor("getter");
/**
 * Transforms set accessors in an arrow function to be merged with corresponding getter, if found, later.
 */
export const transformSetter: VxTransform<ts.SetAccessorDeclaration> = transformAccessor("setter");

function transformAccessor(type: "getter" | "setter"): VxTransform<ts.AccessorDeclaration> {
  return (node) => {
    const variableName = node.name.getText();
    const computedArrowFunction = createArrowFunction(node);

    // We only transform the get/set accessor to a function and later merge them
    // in a computed call
    return {
      imports: namedImports(["computed"]),
      kind: VxResultKind.COMPOSITION,
      nodes: [copySyntheticComments(computedArrowFunction, node)],
      outputVariables: [variableName],
      reference: VxReferenceKind.VARIABLE,
      tag: `Computed-${type}`,
    };
  };
}

/**
 * Merges corresponding transformed getters and setters into a single `computed` call.
 * @param astResult
 * @returns
 */
export const mergeComputed: VxPostProcessor = (astResult) => {
  const getters = astResult.filter((r) => r.tag === "Computed-getter");
  const setters = astResult.filter((r) => r.tag === "Computed-setter");
  const others = astResult.filter(
    (r) => r.tag !== "Computed-getter" && r.tag !== "Computed-setter",
  );

  const [computed, orphanedSetters] = mergeAccessors(getters, setters);

  // Probably shouldn't happen but handle when there are computed setters with no getters
  const justSetters = processOrphanedSetters(orphanedSetters);

  return [...computed, ...justSetters, ...others];
};

function mergeAccessors(
  getters: VxTransformResult<ts.Node>[],
  setters: VxTransformResult<ts.Node>[],
) {
  const leftOverSetters = [...setters];
  const mergedAccessors = getters.reduce((acc, getter) => {
    const variableName = getter.outputVariables[0];
    // find and remove the corresponding setter
    const setterIndex = leftOverSetters.findIndex(
      (setter) => setter.outputVariables[0] === variableName,
    );
    let setter;
    if (setterIndex >= 0) setter = leftOverSetters.splice(setterIndex, 1)[0];

    // If there is no setter we will hoist comments outside of the computed statement
    const leadingComments = setter ? [] : ts.getSyntheticLeadingComments(getter.nodes[0]);
    const trailingComments = setter ? [] : ts.getSyntheticTrailingComments(getter.nodes[0]);

    let computedExpression: ts.Expression;
    const gNodes = getter.nodes[0] as ts.Expression;

    if (setter) {
      const sNodes = setter.nodes[0] as ts.Expression;
      computedExpression = createObjectLiteral([
        ["get", gNodes],
        ["set", sNodes],
      ]);
    } else {
      // strip comments to be hoisted
      computedExpression = setSyntheticComments(gNodes, undefined, undefined);
    }

    const computedCallExpr = createCallExpression("computed", undefined, [computedExpression]);
    const computedConstStatement = createConstStatement(variableName, computedCallExpr);
    const finalConstStatement = setter
      ? computedConstStatement
      : setSyntheticComments(computedConstStatement, leadingComments, trailingComments);

    acc.push(computedResult(variableName, finalConstStatement));

    return acc;
  }, [] as VxTransformResult<ts.Node>[]);

  return [mergedAccessors, leftOverSetters];
}

function processOrphanedSetters(setters: VxTransformResult<ts.Node>[]) {
  return setters.reduce((acc, setter) => {
    const variableName = setter.outputVariables[0];

    // Strip comments to be hoisted
    const setterNode = setter.nodes[0] as ts.Expression;
    const leadingComments = ts.getSyntheticLeadingComments(setterNode);
    const trailingComments = ts.getSyntheticTrailingComments(setterNode);
    const setterNodes = setSyntheticComments(setterNode, undefined, undefined);

    const setterExpression = createObjectLiteral([["set", setterNodes]]);
    const setterCallExpr = createCallExpression("computed", undefined, [setterExpression]);
    const setterConstStatement = setSyntheticComments(
      createConstStatement(variableName, setterCallExpr),
      leadingComments,
      trailingComments,
    );
    const constWithTodo = addTodoComment(
      setterConstStatement,
      "setter with no getter is suspicious...",
    );

    acc.push(computedResult(variableName, constWithTodo));
    return acc;
  }, [] as VxTransformResult<ts.Node>[]);
}

function computedResult(variableName: string, node: ts.Node) {
  return {
    tag: "Computed",
    kind: VxResultKind.COMPOSITION,
    imports: namedImports(["computed"]),
    reference: VxReferenceKind.VARIABLE_VALUE,
    outputVariables: [variableName],
    nodes: [node],
  } as VxTransformResult<ts.Node>;
}

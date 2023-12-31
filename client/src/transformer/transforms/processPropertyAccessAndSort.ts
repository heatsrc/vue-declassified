import { addTodoComment } from "@/helpers/comments.js";
import { createIdentifier, createPropertyAccess } from "@/helpers/tsHelpers.js";
import { isString } from "@/helpers/utils.js";
import { VxPostProcessor, VxReferenceKind, VxResultToImport, VxTransformResult } from "@/types.js";
import getDebug from "debug";
import { cloneNode } from "ts-clone-node";
import ts from "typescript";
import { instancePropertyKeyMap } from "./utils/instancePropertyAccess.js";

const debug = getDebug("vuedc:transformer:processPropertyAccessAndSort");

type TransformerResult = {
  readonly astResult: Exclude<VxTransformResult<ts.Node>, VxResultToImport>;
  readonly dependsOn: string[];
};
export const processPropertyAccessAndSort: VxPostProcessor = (astResults) => {
  debug("Transforming property access expressions in bodies of methods");
  const variableHandlers = getVariableHandlers(astResults);

  const transformerResults = astResults
    .map((astResult) => {
      // TODO don't like mutating this array in the transformer, should refactor
      const dependsOn = new Set<string>();
      const transformer = getTransformer(variableHandlers, dependsOn);
      const nodes = ts.transform(astResult.nodes, [transformer]).transformed;

      return {
        astResult: { ...astResult, nodes } as VxTransformResult<ts.Node>,
        dependsOn: [...dependsOn],
      } as TransformerResult;
    })
    .filter((r): r is TransformerResult => !!r);

  const result = orderByDependencies(transformerResults, astResults.length);

  return result;
};

type VariableHandlers = ReturnType<typeof getVariableHandlers>;
function getVariableHandlers(astResults: VxTransformResult<ts.Node>[]) {
  const getReferences = (ref: VxReferenceKind) => {
    return astResults
      .filter((node) => node.reference === ref)
      .flatMap((node) => node.outputVariables);
  };

  const refVariables = getReferences(VxReferenceKind.VARIABLE_VALUE);
  const variables = getReferences(VxReferenceKind.VARIABLE);
  const definableVariable = getReferences(VxReferenceKind.DEFINABLE_VARIABLE);
  const definableMethods = getReferences(VxReferenceKind.DEFINABLE_METHOD);

  return (name: string, node: ts.PropertyAccessExpression) => {
    if (refVariables.includes(name)) {
      // `this?.<name>` is a hack we're using to avoid creating a `.value`
      // property access. This is because some functions like watch expects a Ref<T>.
      if (node.questionDotToken) return [createIdentifier(name), name] as const;
      return [createPropertyAccess(name, "value"), name] as const;
    }
    if (variables.includes(name)) return [createIdentifier(name), name] as const;

    const instanceProperty = transformInstanceProperties(name, definableVariable, definableMethods);
    if (instanceProperty) return instanceProperty;

    // cloneNode cleanly copies the node and removes any references to the parent
    // without this comments don't properly get copied over
    const clonedNode = cloneNode(node);
    const comment = `Unknown variable source for "this.${name}"`;
    return [addTodoComment(clonedNode, comment), false] as const;
  };
}

function transformInstanceProperties(name: string, variables: string[], methods: string[]) {
  const key = instancePropertyKeyMap.get(name);
  if (!key) return false;

  if (isString(key) && (variables.includes(key) || methods.includes(key))) {
    return [createIdentifier(key), key] as const;
  } else if (!isString(key) && (variables.includes(name) || methods.includes(name))) {
    return [key, name] as const;
  }

  return false;
}

function getTransformer(variableHandlers: VariableHandlers, dependents: Set<string>) {
  const isThisProperty = (node: ts.Node) => ts.SyntaxKind.ThisKeyword === node.kind;
  const isRefsProperty = (node: ts.Node): node is ts.PropertyAccessExpression =>
    ts.isPropertyAccessExpression(node) && node.name.text === "$refs";
  return ((ctx) => {
    const visitor: ts.Visitor<ts.Node, ts.Node> = (node) => {
      if (!ts.isPropertyAccessExpression(node)) return ts.visitEachChild(node, visitor, ctx);
      const nodeExpr = node.expression;
      if (!(isThisProperty(nodeExpr) || isRefsProperty(nodeExpr)))
        return ts.visitEachChild(node, visitor, ctx);

      const name = node.name.text;
      const [newNode, addToDependents] = variableHandlers(name, node);

      if (addToDependents) dependents.add(addToDependents);

      return newNode;
    };

    return (node) => ts.visitNode(node, visitor);
  }) as ts.TransformerFactory<ts.Node>;
}

/**
 * Loops through the transformer results and orders them so dependencies are
 * defined before they are used.
 *
 * @param transformerResults
 * @param numberOfNodes
 * @returns ordered results
 */
function orderByDependencies(transformerResults: TransformerResult[], numberOfNodes: number) {
  const sortLast = (r: TransformerResult) => r.astResult.tag.startsWith("SortLast");
  const resultsWithNoDependencies = transformerResults
    .filter((r) => r.dependsOn.length === 0)
    .filter((r) => !sortLast(r))
    .map((r) => r.astResult);
  const registeredDependencies = resultsWithNoDependencies.flatMap((r) => r.outputVariables);
  // WatchSources are special and make it hard to track dependencies depending
  // if it's just a Ref<T>, function or array of values so we'll just dump them
  // at the end where it is safe
  const lastResults = transformerResults
    .filter((r) => sortLast(r))
    .map((r) => r.astResult)
    .sort((a, b) => b.tag.split(":")[1].localeCompare(a.tag.split(":")[1]));

  let otherResults = transformerResults
    .filter((r) => r.dependsOn.length !== 0)
    .filter((r) => !sortLast(r));

  let result: VxTransformResult<ts.Node>[] = [...resultsWithNoDependencies];

  // Each iteration, loop through the remaining "other" results and add any that
  // have had all the dependencies registered, continue until all results have
  // been registered or the remaining results cannot be registered.
  do {
    let newDependenciesRegistered = false;
    otherResults = otherResults.reduce((acc, curr) => {
      // If all the dependencies used in this node are registered, add it to the
      // result, then register it as a dependency itself
      if (curr.dependsOn.every((d) => registeredDependencies.includes(d))) {
        // TODO Side-effects in reduce make me nervous. This should be refactored
        result.push(curr.astResult);
        registeredDependencies.push(...curr.astResult.outputVariables);
        newDependenciesRegistered = true;
      } else {
        acc.push(curr);
      }
      return acc;
    }, [] as TransformerResult[]);

    // If we've reduced the results and nothing was registered, then all the
    // remaining results have circular/unknown/external dependencies. Break out
    // of the loop otherwise it will never end
    if (!newDependenciesRegistered) {
      result = result.concat(otherResults.map((r) => r.astResult));
      break;
    }
  } while (result.length < numberOfNodes - lastResults.length);

  result = result.concat(lastResults);

  return result;
}

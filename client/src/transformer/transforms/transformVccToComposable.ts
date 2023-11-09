import { createIdentifier, newLineNode } from "@/helpers/tsHelpers";
import { isMixin } from "@/registry";
import { VxPostProcessor, VxReferenceKind, VxResultKind } from "@/types";
import getDebug from "debug";
import ts from "typescript";
import { getBody, getUsedDefinables } from "../resultsProcessor";

const debug = getDebug("vuedc:transformer:transformMixin");
const u = undefined;

/**
 * When transforming a mixin, we need to transform the results into a composable
 * function
 * @param bodyResults collection of statements to insert into body of function
 * @param program
 * @returns
 */
export const transformVccToComposable: VxPostProcessor = (bodyResults, _program, classNode) => {
  if (!isMixin()) return bodyResults;

  let name = classNode.name?.text ?? "AnonymousMixin";
  debug(`Transforming ${name} into composable function.`);
  name = `use${name[0].toUpperCase()}${name.slice(1)}`;
  name = name.replace(/Mixin$/, "");
  const id = createIdentifier(name);
  const body = getBody(bodyResults);
  const usedDefinables = getUsedDefinables(bodyResults);
  const unwantedResultValues = usedDefinables.flat();
  const returnValues = bodyResults.reduce((acc, result) => {
    const { outputVariables } = result;

    const props = outputVariables
      .filter((v) => !unwantedResultValues.includes(v))
      .map((v) => ts.factory.createShorthandPropertyAssignment(v));
    acc.push(...props);
    return acc;
  }, [] as ts.ShorthandPropertyAssignment[]);

  const paramVars = [...new Set(usedDefinables.flatMap((d) => d[0]))];
  const params = paramVars.map((d) => ts.factory.createParameterDeclaration(u, u, d, u));

  const returnObject = ts.factory.createObjectLiteralExpression(returnValues, false);
  const returnStatement = ts.factory.createReturnStatement(returnObject);

  body.push(newLineNode(), returnStatement);
  const block = ts.factory.createBlock(body, true);

  const mods = [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)];
  const composableFn = ts.factory.createFunctionDeclaration(mods, u, id, u, params, u, block);
  return [
    {
      imports: [],
      kind: VxResultKind.COMPOSITION,
      nodes: [newLineNode(), composableFn],
      outputVariables: [],
      reference: VxReferenceKind.NONE,
      tag: "ComposableFunction",
    },
  ];
};

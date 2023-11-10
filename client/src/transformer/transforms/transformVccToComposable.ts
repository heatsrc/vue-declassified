import { createIdentifier, newLineNode } from "@/helpers/tsHelpers";
import { isMixin } from "@/registry";
import {
  VxImportModule,
  VxPostProcessor,
  VxReferenceKind,
  VxResultKind,
  VxTransformResult,
} from "@/types";
import getDebug from "debug";
import ts from "typescript";
import { getBody, getUsedDefinables } from "../resultsProcessor";
import { instanceDependencies, instancePropertyKeyLookup } from "./utils/instancePropertyAccess";

const debug = getDebug("vuedc:transformer:transformMixin");
const u = undefined;

/**
 * When transforming a mixin, we need to transform the results into a composable
 * function.
 *
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

  const { returnProps, imports } = getReturnPropsAndImports(bodyResults, usedDefinables);

  const paramVars = [...new Set(usedDefinables.flatMap((d) => d[0]))];
  const params = paramVars.map((d) => ts.factory.createParameterDeclaration(u, u, d, u));

  const returnObject = ts.factory.createObjectLiteralExpression(returnProps, false);
  const returnStatement = ts.factory.createReturnStatement(returnObject);

  body.push(newLineNode(), returnStatement);
  const block = ts.factory.createBlock(body, true);

  const mods = [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)];
  const composableFn = ts.factory.createFunctionDeclaration(mods, u, id, u, params, u, block);
  return [
    {
      imports,
      kind: VxResultKind.COMPOSITION,
      nodes: [newLineNode(), composableFn],
      outputVariables: [],
      reference: VxReferenceKind.NONE,
      tag: "ComposableFunction",
    },
  ];
};

function getImportClauses(i: VxImportModule) {
  const clauses = i.named ?? [];
  if (i.default) clauses.push(i.default);
  return clauses;
}

type ReturnPropsAndImports = {
  returnProps: ts.ShorthandPropertyAssignment[];
  imports: VxImportModule[];
};

/**
 * Returns the properties to export from the composable and a filtered list of
 * imports needed to be added to the file
 *
 * @param bodyResults
 * @param usedDefinables
 * @returns
 */
function getReturnPropsAndImports(
  bodyResults: VxTransformResult<ts.Node>[],
  usedDefinables: string[][],
) {
  const unwantedResultValues = usedDefinables.flat();
  const unwantedImports = getUnwantedImports(unwantedResultValues);

  const propsAndImports = bodyResults.reduce(
    (acc, result) => {
      const { outputVariables, imports } = result;

      const props = outputVariables
        .filter((v) => !unwantedResultValues.includes(v))
        .map((v) => ts.factory.createShorthandPropertyAssignment(v));

      const importClauses = imports.filter((i) => {
        const clauses = getImportClauses(i);
        return !clauses.some((v) => unwantedImports.includes(v));
      });

      acc.returnProps.push(...props);
      acc.imports.push(...importClauses);
      return acc;
    },
    { returnProps: [], imports: [] } as ReturnPropsAndImports,
  );

  return propsAndImports;
}

/**
 * We don't want to include imports for parameters expected to be passed to the
 * composable function from the component
 * @param unwantedResultValues
 * @returns
 */
function getUnwantedImports(unwantedResultValues: string[]) {
  return unwantedResultValues
    .flatMap((v) => {
      const key = instancePropertyKeyLookup.get(v);
      if (!key) return;
      const mods = instanceDependencies.get(key)?.();
      if (!mods) return;
      const clauses = mods.imports.flatMap((i) => getImportClauses(i));
      return clauses;
    })
    .filter((v): v is string => !!v);
}

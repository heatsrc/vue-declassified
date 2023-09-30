import {
  createCallExpression,
  createConstStatement,
  createIdentifier,
} from "@/helpers/tsHelpers.js";
import {
  VxPostProcessor,
  VxReferenceKind,
  VxResultKind,
  VxResultToMacro,
  VxTransformResult,
} from "@/types.js";
import ts from "typescript";

export const mergeMacros: VxPostProcessor = (results, program) => {
  const macroResults = results.filter((d): d is VxResultToMacro => d?.kind === VxResultKind.MACRO);
  const otherResults = results.filter(
    (d): d is VxTransformResult<ts.Expression> => d?.kind !== VxResultKind.MACRO,
  );

  const macros = mergeMacroResults(macroResults);

  return [...macros, ...otherResults];
};

function mergeMacroResults(macroResults: VxResultToMacro[]) {
  const macrosByTag = macroResults.reduce((acc, macro) => {
    if (!acc.get(macro.tag)) acc.set(macro.tag, []);
    const existing = acc.get(macro.tag)!;
    existing.push(macro);
    return acc;
  }, new Map<string, VxResultToMacro[]>());

  const macroStatements: VxTransformResult<ts.VariableStatement>[] = [];

  macrosByTag.forEach((macros, key) => {
    const macroName = key.split("-")[1];
    const varName = macros[0].outputVariables[0];

    const mergedProperties = macros
      .flatMap((m) => m.typeProperties)
      .reduce((acc, [k, v, q]) => {
        if (!acc.has(k)) {
          acc.set(k, [v, q]);
          return acc;
        }
        const existing = acc.get(k)!;
        if (existing[0].kind === ts.SyntaxKind.UndefinedKeyword) acc.set(k, [v, q]);
        return acc;
      }, new Map<string, [type: ts.TypeNode, optional?: boolean]>());

    const TypeElements = [...mergedProperties].map(([p, [v, q]]) => {
      const prop = ts.factory.createStringLiteral(p);
      const qToken = q ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined;
      return ts.factory.createPropertySignature(undefined, prop, qToken, v);
    });
    const TypeLiteral = ts.factory.createTypeLiteralNode(TypeElements);
    let callExpr = createCallExpression(macroName, TypeLiteral);

    if (macroName === "defineProps") {
      const defaults = macros.flatMap((m) => m.nodes);
      callExpr = propsWithDefaults(callExpr, defaults);
    }

    const constStatement = createConstStatement(varName, callExpr);
    macroStatements.push(macroResult(varName, constStatement));
  });

  return macroStatements;
}

function macroResult(variableName: string, node: ts.VariableStatement) {
  return {
    tag: "Macro",
    kind: VxResultKind.MACRO,
    imports: [],
    reference: VxReferenceKind.DEFINABLE_VARIABLE,
    outputVariables: [variableName],
    nodes: [node],
    typeProperties: [],
  } as VxResultToMacro<ts.VariableStatement>;
}

function propsWithDefaults(defineProps: ts.CallExpression, defaultProps: ts.PropertyAssignment[]) {
  if (!defaultProps || defaultProps.length <= 0) return defineProps;
  const defaultValues = ts.factory.createObjectLiteralExpression(defaultProps, true);
  const id = createIdentifier("withDefaults");
  const withDefaults = ts.factory.createCallExpression(id, undefined, [defineProps, defaultValues]);
  return withDefaults;
}

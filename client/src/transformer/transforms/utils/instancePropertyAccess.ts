import {
  createCallExpression,
  createConstStatement,
  getPrimitiveKeyword,
} from "@/helpers/tsHelpers.js";
import { namedImports } from "@/helpers/utils.js";
import {
  VxPostProcessor,
  VxReferenceKind,
  VxResultKind,
  VxResultToComposable,
  VxResultToImport,
  VxResultToMacro,
  VxTransformResult,
} from "@/types.js";
import { cloneNode } from "ts-clone-node";
import ts from "typescript";

/**
 * Instance properties are internal(ish) properties in Vue components that need
 * to be defined differently in script setup. Some are defined with macros
 * (e.g., `defineProps`), some with composables (e.g., `useRouter`), and some
 * are just imports from the main vue package now.
 */

export const instanceDependencies = new Map([
  ["$attrs", getConversion(VxResultKind.COMPOSABLE, "attrs", "useAttrs", "vue")],
  ["$emit", getConversion(VxResultKind.MACRO, "emit", "defineEmits")],
  ["$nextTick", getConversion(VxResultKind.IMPORT, null, "nextTick", "vue")],
  ["$options", getConversion(VxResultKind.MACRO, "options", "defineOptions")],
  ["$props", getConversion(VxResultKind.MACRO, "props", "defineProps")],
  ["$route", getConversion(VxResultKind.COMPOSABLE, "route", "useRoute", "vue-router")],
  ["$router", getConversion(VxResultKind.COMPOSABLE, "router", "useRouter", "vue-router")],
  ["$scopedSlots", getConversion(VxResultKind.MACRO, "slots", "defineSlots")],
  ["$slots", getConversion(VxResultKind.MACRO, "slots", "defineSlots")],
  ["$store", getConversion(VxResultKind.COMPOSABLE, "store", "useStore", "vuex")],
  ["$watch", getConversion(VxResultKind.IMPORT, null, "watch", "vue")],
]);

export function tryToFindType(node: ts.Expression, program: ts.Program) {
  // If current node is a Keyword Literal we can use default to that for now
  let keyword = getPrimitiveKeyword(node.kind);

  const checker = program.getTypeChecker();
  const declaration = checker.getSymbolAtLocation(node)?.valueDeclaration;

  // Check the declaration of the node to see if it has a type
  if (declaration && (ts.isParameter(declaration) || ts.isVariableDeclaration(declaration))) {
    if (declaration.type) return cloneNode(declaration.type);
    else if (declaration.initializer) {
      keyword = getPrimitiveKeyword(declaration.initializer.kind);
    }
  }

  // keyword falls back to `unknown` is all else fails.
  const tupleType = ts.factory.createKeywordTypeNode(keyword);

  return tupleType;
}

export function tryGettingEventName(node: ts.Identifier, program: ts.Program) {
  const checker = program.getTypeChecker();
  const declaration = checker.getSymbolAtLocation(node)?.valueDeclaration;

  if (declaration && (ts.isParameter(declaration) || ts.isVariableDeclaration(declaration))) {
    if (declaration.initializer && ts.isStringLiteralLike(declaration.initializer)) {
      return declaration.initializer.text;
    }
  }

  let fallbackName = `DECLASS_TODO can't convert var "${node.text}" to type property`;
  return fallbackName;
}

function getConversion(
  kind: VxResultKind,
  varName: string | null,
  callExpression: string,
  importModule?: string,
) {
  if (kind === VxResultKind.COMPOSABLE)
    return {
      kind,
      tag: `Composable-${callExpression}`,
      imports: namedImports([callExpression], importModule),
      outputVariables: [varName],
      reference: VxReferenceKind.VARIABLE,
      nodes: [getComposableNode(varName!, callExpression)],
      typeProperties: [],
    } as VxResultToComposable;

  if (kind === VxResultKind.MACRO)
    return {
      kind,
      tag: `Macro-${callExpression}`,
      imports: [],
      outputVariables: [varName],
      reference: VxReferenceKind.VARIABLE,
      nodes: [],
      typeProperties: [],
    } as VxResultToMacro;

  return {
    kind,
    tag: `Import-${callExpression}`,
    imports: namedImports([callExpression], importModule),
    outputVariables: [callExpression],
    reference: VxReferenceKind.NONE,
    nodes: [],
  } as VxResultToImport;
}

function getComposableNode(varName: string, callExprName: string) {
  const callExpr = createCallExpression(callExprName);
  const constStatement = createConstStatement(varName, callExpr);
  return constStatement;
}

export const mergeComposables: VxPostProcessor = (results, program) => {
  const composableResults = results.filter((d): d is VxResultToComposable<ts.Expression> => {
    return !!d && d.kind === VxResultKind.COMPOSABLE;
  });
  const otherResults = results.filter((d): d is VxResultToComposable<ts.Expression> => {
    return !!d && d.kind !== VxResultKind.COMPOSABLE;
  });

  let composableSet = new Set<string>();
  const composables = composableResults.reduce((acc, composable) => {
    if (composableSet.has(composable.tag)) return acc;
    composableSet.add(composable.tag);
    acc.push(composable);
    return acc;
  }, [] as VxTransformResult<ts.Node>[]);
  return [...composables, ...otherResults];
};
export const mergeMacros: VxPostProcessor = (results, program) => {
  const macroResults = results.filter(
    (d): d is VxResultToMacro<ts.Expression> => !!d && d.kind === VxResultKind.MACRO,
  );
  const otherResults = results.filter(
    (d): d is VxResultToMacro<ts.Expression> => !!d && d.kind !== VxResultKind.MACRO,
  );

  const macros = mergeMacroResults(macroResults);

  return [...macros, ...otherResults];
};

function mergeMacroResults(macroResults: VxResultToMacro<ts.Expression>[]) {
  const macrosByTag = macroResults.reduce((acc, macro) => {
    if (!acc.get(macro.tag)) acc.set(macro.tag, []);
    const existing = acc.get(macro.tag)!;
    existing.push(macro);
    return acc;
  }, new Map<string, VxResultToMacro<ts.Expression>[]>());

  const macroStatements: VxTransformResult<ts.VariableStatement>[] = [];

  macrosByTag.forEach((macros, key) => {
    const macroName = key.split("-")[1];
    const varName = macros[0].outputVariables[0];

    const mergedProperties = macros
      .flatMap((m) => m.typeProperties)
      .reduce((acc, [k, v]) => {
        if (!acc.has(k)) {
          acc.set(k, v);
          return acc;
        }
        const existing = acc.get(k)!;
        if (existing.kind === ts.SyntaxKind.UndefinedKeyword) acc.set(k, v);
        return acc;
      }, new Map<string, ts.TypeNode>());

    const TypeElements = [...mergedProperties].map(([p, v]) => {
      const prop = ts.factory.createStringLiteral(p);
      return ts.factory.createPropertySignature(undefined, prop, undefined, v);
    });
    const TypeLiteral = ts.factory.createTypeLiteralNode(TypeElements);
    const callExpr = createCallExpression(macroName, TypeLiteral);
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
    reference: VxReferenceKind.VARIABLE,
    outputVariables: [variableName],
    nodes: [node],
    typeProperties: [],
  } as VxResultToMacro<ts.VariableStatement>;
}

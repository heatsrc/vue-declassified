import { createCallExpression, createConstStatement } from "@/helpers/tsHelpers.js";
import { namedImports } from "@/helpers/utils.js";
import {
  VxReferenceKind,
  VxResultKind,
  VxResultToComposable,
  VxResultToImport,
  VxResultToMacro,
} from "@/types.js";
import ts from "typescript";

/**
 * Instance properties are internal(ish) properties in Vue components that need
 * to be defined differently in script setup. Some are defined with macros
 * (e.g., `defineProps`), some with composables (e.g., `useRouter`), and some
 * are just imports from the main vue package now.
 */

const keyMap = [
  ["$attrs", "attrs"],
  ["$emit", "emit"],
  ["$nextTick", "nextTick"],
  ["$options", "options"],
  ["$props", "props"],
  ["$route", "route"],
  ["$router", "router"],
  ["$scopedSlots", "slots"],
  ["$slots", "slots"],
  ["$store", "store"],
  ["$watch", "watch"],
] as const;
const keyMapLookup = keyMap.map((k) => [k[1], k[0]] as const);

export const instancePropertyKeyMap = new Map<string, string | ts.PropertyAccessExpression>(keyMap);
export const instancePropertyKeyLookup = new Map<string, string>(keyMapLookup);

export const instanceDependencies = new Map([
  ["$attrs", () => getConversion(VxResultKind.COMPOSABLE, "attrs", "useAttrs", "vue")],
  ["$emit", () => getConversion(VxResultKind.MACRO, "emit", "defineEmits")],
  ["$nextTick", () => getConversion(VxResultKind.IMPORT, null, "nextTick", "vue")],
  ["$options", () => getConversion(VxResultKind.MACRO, "options", "defineOptions")],
  ["$props", () => getConversion(VxResultKind.MACRO, "props", "defineProps")],
  ["$route", () => getConversion(VxResultKind.COMPOSABLE, "route", "useRoute", "vue-router")],
  ["$router", () => getConversion(VxResultKind.COMPOSABLE, "router", "useRouter", "vue-router")],
  ["$scopedSlots", () => getConversion(VxResultKind.MACRO, "slots", "defineSlots")],
  ["$slots", () => getConversion(VxResultKind.MACRO, "slots", "defineSlots")],
  ["$store", () => getConversion(VxResultKind.COMPOSABLE, "store", "useStore", "vuex")],
  ["$watch", () => getConversion(VxResultKind.IMPORT, null, "watch", "vue")],
]);

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
      reference: VxReferenceKind.DEFINABLE_VARIABLE,
      nodes: [getComposableNode(varName!, callExpression)],
      typeProperties: [],
    } as VxResultToComposable;

  if (kind === VxResultKind.MACRO)
    return {
      kind,
      tag: `Macro-${callExpression}`,
      imports: [],
      outputVariables: [varName],
      reference: VxReferenceKind.DEFINABLE_VARIABLE,
      nodes: [],
      typeProperties: [],
    } as VxResultToMacro;

  return {
    kind,
    tag: `Import-${callExpression}`,
    imports: namedImports([callExpression], importModule),
    outputVariables: [callExpression],
    reference: VxReferenceKind.DEFINABLE_METHOD,
    nodes: [],
  } as VxResultToImport;
}

function getComposableNode(varName: string, callExprName: string) {
  const callExpr = createCallExpression(callExprName);
  const constStatement = createConstStatement(varName, callExpr);
  return constStatement;
}

import {
  createCallExpression,
  createConstStatement,
  getPrimitiveKeyword,
} from "@/helpers/tsHelpers.js";
import { namedImports } from "@/helpers/utils.js";
import {
  VxReferenceKind,
  VxResultKind,
  VxResultToComposable,
  VxResultToImport,
  VxResultToMacro,
} from "@/types.js";
import { cloneNode } from "ts-clone-node";
import ts from "typescript";

/**
 * Instance properties are internal(ish) properties in Vue components that need
 * to be defined differently in script setup. Some are defined with macros
 * (e.g., `defineProps`), some with composables (e.g., `useRouter`), and some
 * are just imports from the main vue package now.
 */

export const instancePropertyKeyMap = new Map<string, string | ts.PropertyAccessExpression>([
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
]);

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

export function tryToFindType(node: ts.Expression | ts.ParameterDeclaration, program: ts.Program) {
  // If current node is a Keyword Literal we can use default to that for now
  let keyword = getPrimitiveKeyword(node.kind);

  if (ts.isParameter(node) || ts.isVariableDeclaration(node)) {
    if (node.type) return cloneNode(node.type);
    else if (node.initializer) {
      keyword = getPrimitiveKeyword(node.initializer.kind);
    }
  }

  const checker = program.getTypeChecker();
  const declaration = checker.getSymbolAtLocation(node)?.valueDeclaration;

  // Check the declaration of the node to see if it has a type
  if (
    declaration &&
    (ts.isParameter(declaration) ||
      ts.isVariableDeclaration(declaration) ||
      ts.isAccessor(declaration))
  ) {
    if (declaration.type) return cloneNode(declaration.type);
    else if (!ts.isAccessor(declaration) && declaration.initializer) {
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
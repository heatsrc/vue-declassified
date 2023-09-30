import type ts from "typescript";

// TODO review this file for unneeded types

export enum VxResultKind {
  /** Goes in the body of script setup */
  COMPOSITION,
  /** values are defined by a macro (e.g., `defineProps`) */
  MACRO,
  /** values are defined by composable (e.g., `useStore`) */
  COMPOSABLE,
  /** value is defined by import (e.g., `import {nextTick} from 'vue'`) */
  IMPORT,
  /** values that need to be in `defineOptions` macro */
  OPTIONS,
}

export enum VxMacro {
  DEFINE_EMITS,
  DEFINE_EXPOSE,
  DEFINE_OPTIONS,
  DEFINE_PROPS,
  DEFINE_SLOTS,
  WITH_DEFAULT,
}

export enum VxReferenceKind {
  DEFINABLE_METHOD,
  DEFINABLE_VARIABLE,
  /** reactive variables that require `.value` */
  VARIABLE_VALUE,
  /** variables not requiring `.value` (may or may not be reactive) */
  VARIABLE,
  /** no variable assignment */
  NONE,
}

export interface VxImportClause {
  named: Set<string>;
  default?: string;
  params?: ts.Expression[];
}

type VxExternalImport = {
  default?: string;
  named?: string[];
  external: string;
};
type VxInternalImport = {
  default?: string;
  named?: string[];
  path: string;
};
export type VxImportModule = VxExternalImport | VxInternalImport;

export enum VxDependencyKind {
  /** Compile macro, no import */
  MACRO,
  /** Composable, requires import and assigning a "namespace" */
  COMPOSABLE,
  /** Import a function only */
  IMPORT,
}

export type VxDependencies = {
  kind: VxDependencyKind;
  /** name to give VariableDeclaration */
  declaration: string;
  /** name to use for CallExpression */
  callExpression: string;
  /** properties to add to CallExpression TypeLiteral */
  typeProperties: [propId: string, type: ts.Type][];
  /** Additional required imports */
  imports: VxImportModule[] | never[];
};

export interface VxResultBase {
  imports: VxImportModule[];
  kind: VxResultKind;
  reference: VxReferenceKind;
  /** List of variables output */
  outputVariables: string[];
  /** Unique id for grouping and merging (e.g., computed getter/setter, props, etc) */
  tag: string;
}

export interface VxResultToComposition<N = ts.Statement> extends VxResultBase {
  kind: VxResultKind.COMPOSITION;
  nodes: N[];
}
export interface VxResultToOptions<N = ts.Statement> extends VxResultBase {
  kind: VxResultKind.OPTIONS;
  nodes: N[];
}

export interface VxResultToMacro<N = ts.PropertyAssignment> extends VxResultBase {
  kind: VxResultKind.MACRO;
  typeProperties: [propId: string, type: ts.TypeNode, optional?: boolean][];
  /** Default values (only really applies to defineProps) */
  nodes: N[];
}
export interface VxResultToComposable<N = ts.Statement> extends VxResultBase {
  kind: VxResultKind.COMPOSABLE;
  nodes: N[];
}
export interface VxResultToImport extends VxResultBase {
  kind: VxResultKind.IMPORT;
  nodes: [];
}

export type VxTransformResult<N> =
  | VxResultToComposition<N>
  | VxResultToMacro<N>
  | VxResultToOptions<N>
  | VxResultToComposable<N>
  | VxResultToImport
  | VxResultToComposable<N>;

function isResultType<T extends VxTransformResult<ts.Node>>(
  result: VxTransformResult<ts.Node>,
  kind: T["kind"],
): result is T {
  return result.kind === kind;
}

export function isCompositionType(r: VxTransformResult<ts.Node>): r is VxResultToComposition {
  return isResultType(r, VxResultKind.COMPOSITION);
}
export function isMacroType(r: VxTransformResult<ts.Node>): r is VxResultToMacro {
  return isResultType(r, VxResultKind.MACRO);
}
export function isComposableType(r: VxTransformResult<ts.Node>): r is VxResultToComposable {
  return isResultType(r, VxResultKind.COMPOSABLE);
}

export function isImportType(r: VxTransformResult<ts.Node>): r is VxResultToImport {
  return isResultType(r, VxResultKind.IMPORT);
}

export type VxTransformReturnType = {
  shouldContinue: boolean;
  result?: VxTransformResult<ts.Node> | VxTransformResult<ts.Node>[];
};

export type VxTransform<T extends ts.Node> = (
  node: T,
  program: ts.Program,
) => VxTransformReturnType;

export type VxPostProcessor = (
  astResults: VxTransformResult<ts.Node>[],
  program: ts.Program,
) => VxTransformResult<ts.Node>[];

export interface VxClassTransforms {
  [ts.SyntaxKind.Decorator]: {
    [ts.SyntaxKind.PropertyAssignment]: VxTransform<ts.PropertyAssignment>[];
    [ts.SyntaxKind.MethodDeclaration]: VxTransform<ts.MethodDeclaration>[];
  };
  [ts.SyntaxKind.Identifier]: VxTransform<ts.Identifier>[];
  [ts.SyntaxKind.HeritageClause]: VxTransform<ts.HeritageClause>[];
  [ts.SyntaxKind.PropertyDeclaration]: VxTransform<ts.PropertyDeclaration>[];
  [ts.SyntaxKind.GetAccessor]: VxTransform<ts.GetAccessorDeclaration>[];
  [ts.SyntaxKind.SetAccessor]: VxTransform<ts.SetAccessorDeclaration>[];
  [ts.SyntaxKind.MethodDeclaration]: VxTransform<ts.MethodDeclaration>[];
  after: VxPostProcessor[];
}

export type VxClassMemberTransforms = Omit<VxClassTransforms, ts.SyntaxKind.Decorator | "after">;

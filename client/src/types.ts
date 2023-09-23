import type ts from "typescript";

export enum VxResultKind {
  /** Goes in the body of script setup */
  COMPOSITION,
  /** values are defined by a macro (e.g., `defineProps`) */
  MACRO,
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
  /** component props */
  PROPS,
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

export type VxComposableStatement =
  | {
      default?: string;
      func: string;
      params?: ts.Expression[];
    }
  | {
      named?: string[];
      func: string;
      params?: ts.Expression[];
    };
export interface VxResultBase {
  imports: VxImportModule[];
  kind: VxResultKind;
  reference: VxReferenceKind;
  /** List of variables output */
  outputVariables: string[];
  /** Unique id for grouping and merging (e.g., computed getter/setter, props, etc) */
  tag: string;
  /** Composables that need to be used */
  composables?: VxComposableStatement[];
}

export interface VxResultToComposition<N = ts.Statement> extends VxResultBase {
  kind: VxResultKind.COMPOSITION;
  nodes: N[];
}

export interface VxResultToMacro<N = ts.Statement> extends VxResultBase {
  kind: VxResultKind.MACRO;
  macro: VxMacro;
  nodes: N[];
}
export type VxTransformResult<N> = VxResultToComposition<N>;

export type VxTransform<T extends ts.Node> = (
  node: T,
  program: ts.Program,
) => VxTransformResult<ts.Node> | false;

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

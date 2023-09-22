import type ts from "typescript";

export enum VxResultKind {
  COMPOSITION,
  OPTIONS,
}

export enum VxReferenceKind {
  PROPS,
  VARIABLE_VALUE,
  VARIABLE_NON_NULL_VALUE,
  VARIABLE,
  CONTEXT,
  NONE,
  TEMPLATE_REF,
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
  attributes: string[];
  tag: string;
  composables?: VxComposableStatement[];
}

export interface VxResultToOptions<N = ts.PropertyAssignment> extends VxResultBase {
  kind: VxResultKind.OPTIONS;
  nodes: N[];
}

export interface VxResultToComposition<N = ts.Statement> extends VxResultBase {
  kind: VxResultKind.COMPOSITION;
  nodes: N[];
}

export type VxTransformResult<N> = VxResultToComposition<N> | VxResultToOptions<N>;

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

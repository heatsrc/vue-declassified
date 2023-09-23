import ts from "typescript";
import { VxClassTransforms } from "../types.js";
import {
  mergeComputed,
  transformGetter,
  transformSetter,
} from "./transforms/vue-class-component/Computed.js";
import { transformData } from "./transforms/vue-class-component/Data.js";

export const classTransforms: VxClassTransforms = {
  /** Primary decorate: @Options or Component */
  [ts.SyntaxKind.Decorator]: {
    /** Options object: name, props */
    [ts.SyntaxKind.PropertyAssignment]: [],
    /** Options object: data, lifecycle hooks */
    [ts.SyntaxKind.MethodDeclaration]: [],
  },

  /** Class name */
  [ts.SyntaxKind.Identifier]: [],
  /** extends Vue | Mixins */
  [ts.SyntaxKind.HeritageClause]: [],
  /** Data properties, @Model, @Prop, @Watch, @Provide, @Inject, @Ref, @State, @Getter, @Action, @Mutation */
  [ts.SyntaxKind.PropertyDeclaration]: [transformData],
  /** Class computed getters via get */
  [ts.SyntaxKind.GetAccessor]: [transformGetter],
  /** Class computed setters via set */
  [ts.SyntaxKind.SetAccessor]: [transformSetter],
  /** Class methods, lifecycle hooks, watch, emits, render and interval hook */
  [ts.SyntaxKind.MethodDeclaration]: [],
  /** Post processing transforms */
  after: [mergeComputed],
};

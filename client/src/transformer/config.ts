import ts from "typescript";
import { VxClassTransforms } from "../types.js";
import { processPropertyAccessAndSort } from "./transforms/processPropertyAccessAndSort.js";
import { mergeComposables, mergeMacros } from "./transforms/utils/instancePropertyAccess.js";
import {
  mergeComputed,
  transformGetter,
  transformSetter,
} from "./transforms/vue-class-component/Computed.js";
import { transformData } from "./transforms/vue-class-component/Data.js";
import { transformDefinables } from "./transforms/vue-class-component/InstanceProperties.js";
import { transformLifecycleHooks } from "./transforms/vue-class-component/LifecycleHooks.js";
import { transformMethod } from "./transforms/vue-class-component/Method.js";
import { transformTemplateRef } from "./transforms/vue-class-component/TemplateRef.js";

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
  [ts.SyntaxKind.PropertyDeclaration]: [transformDefinables, transformTemplateRef, transformData],
  /** Class computed getters via get */
  [ts.SyntaxKind.GetAccessor]: [transformDefinables, transformGetter],
  /** Class computed setters via set */
  [ts.SyntaxKind.SetAccessor]: [transformDefinables, transformSetter],
  /** Class methods, lifecycle hooks, watch, emits, render and interval hook */
  [ts.SyntaxKind.MethodDeclaration]: [
    transformDefinables,
    transformLifecycleHooks,
    transformMethod,
  ],
  /** Post processing transforms */
  after: [mergeMacros, mergeComposables, mergeComputed, processPropertyAccessAndSort],
};

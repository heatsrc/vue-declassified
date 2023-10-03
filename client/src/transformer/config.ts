import { VxClassTransforms } from "@/types.js";
import ts from "typescript";
import { mergeComposables } from "./transforms/mergeComposables.js";
import { mergeMacros } from "./transforms/mergeMacros.js";
import { processPropertyAccessAndSort } from "./transforms/processPropertyAccessAndSort.js";
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
import { transformOptionsExpose } from "./transforms/vue-class-component/decorator-options/Expose.js";
import { transformOptionsProps } from "./transforms/vue-class-component/decorator-options/Props.js";
import { transformDecoratorProvide } from "./transforms/vue-class-component/decorator-options/Provide.js";
import { transformOptionsWatch } from "./transforms/vue-class-component/decorator-options/Watches.js";
import { transformEmitDecorator } from "./transforms/vue-property-decorator/Emit.js";
import { transformPropDecorator } from "./transforms/vue-property-decorator/Prop.js";
import { transformDecoratorRef } from "./transforms/vue-property-decorator/Ref.js";
import { transformWatchDecorator } from "./transforms/vue-property-decorator/Watch.js";

export const classTransforms: VxClassTransforms = {
  /** Primary decorate: @Options or Component */
  [ts.SyntaxKind.Decorator]: {
    /** Options object: name, props */
    [ts.SyntaxKind.PropertyAssignment]: [
      transformOptionsProps,
      transformOptionsWatch,
      transformOptionsExpose,
    ],
    /** Options object: data, lifecycle hooks */
    [ts.SyntaxKind.MethodDeclaration]: [],
  },

  /** Class name */
  [ts.SyntaxKind.Identifier]: [],
  /** extends Vue | Mixins */
  [ts.SyntaxKind.HeritageClause]: [],
  /** Data properties, @Model, @Prop, @Watch, @Provide, @Inject, @Ref, @State, @Getter, @Action, @Mutation */
  [ts.SyntaxKind.PropertyDeclaration]: [
    transformDefinables,
    transformTemplateRef,
    transformPropDecorator,
    transformDecoratorRef,
    transformDecoratorProvide,
    transformData,
  ],
  /** Class computed getters via get */
  [ts.SyntaxKind.GetAccessor]: [transformDefinables, transformGetter],
  /** Class computed setters via set */
  [ts.SyntaxKind.SetAccessor]: [transformDefinables, transformSetter],
  /** Class methods, lifecycle hooks, watch, emits, render and interval hook */
  [ts.SyntaxKind.MethodDeclaration]: [
    transformDefinables,
    transformLifecycleHooks,
    transformWatchDecorator,
    transformEmitDecorator,
    transformMethod,
  ],
  /** Post processing transforms */
  after: [mergeMacros, mergeComposables, mergeComputed, processPropertyAccessAndSort],
};

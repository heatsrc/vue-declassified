import { copySyntheticComments } from "@/helpers/comments.js";
import { createArrowFunction, createExpressionStatement } from "@/helpers/tsHelpers.js";
import { namedImports } from "@/helpers/utils.js";
import { VxReferenceKind, VxResultKind, VxTransform } from "@/types.js";
import ts from "typescript";

const lifeCycleHooks = new Map<string, string | false>([
  ["beforeCreate", false],
  ["created", false],
  ["beforeMount", "onBeforeMount"],
  ["mounted", "onMounted"],
  ["beforeUpdate", "onBeforeUpdate"],
  ["updated", "onUpdated"],
  ["activated", "onActivated"],
  ["deactivated", "onDeactivated"],
  ["beforeDestroy", "onBeforeUnmount"],
  ["destroyed", "onUnmounted"],
  ["errorCaptured", "onErrorCaptured"],
]);

/**
 * Transform Vue class component life cycle hooks in to Vue 3 composition API.
 * When encountering a lifecycle hook that has been removed (i.e.,
 * `beforeCreate` and `created`), the body of the method is returned as is.
 *
 * @param node
 * @returns
 */
export const transformLifecycleHooks: VxTransform<ts.MethodDeclaration> = (node) => {
  const hookName = node.name.getText();

  if (!lifeCycleHooks.has(hookName)) return false;

  const namedImport = lifeCycleHooks.get(hookName);
  let outputNodes: ts.Statement[] | ts.ExpressionStatement[];

  if (!namedImport) {
    if (!node.body) return false;
    // get the body of the method and return it
    outputNodes = node.body?.statements.map((stmt, index) => {
      if (index === 1) copySyntheticComments(stmt, node);
      return stmt;
    });
  } else {
    const hookMethod = createArrowFunction(node);
    const callExpr = createExpressionStatement(namedImport, undefined, [hookMethod]);
    copySyntheticComments(callExpr, node);
    outputNodes = [callExpr];
  }

  return {
    tag: "LifeCycleHook",
    kind: VxResultKind.COMPOSITION,
    reference: VxReferenceKind.NONE,
    nodes: outputNodes,
    outputVariables: namedImport ? [namedImport] : [],
    imports: namedImport ? namedImports([namedImport]) : [],
  };
};

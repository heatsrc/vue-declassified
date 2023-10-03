import { addTodoComment } from "@/helpers/comments.js";
import { createCallExpression, createConstStatement, getDecorators } from "@/helpers/tsHelpers.js";
import { registerDecorator } from "@/transformer/registry.js";
import { VxReferenceKind, VxResultKind, VxTransform } from "@/types.js";
import { cloneNode } from "ts-clone-node";
import ts from "typescript";

const DECORATOR = "Ref";

export const transformDecoratorRef: VxTransform<ts.PropertyDeclaration> = (prop, program) => {
  if (!ts.isPropertyDeclaration(prop)) return { shouldContinue: true };

  const decorators = getDecorators(prop, DECORATOR);

  if (!decorators || decorators.length <= 0) return { shouldContinue: true };
  if (decorators.length > 1)
    throw new Error(
      `[vue-property-decorator] Duplicate @${DECORATOR} decorators for ${prop.name.getText()}`,
    );

  registerDecorator(DECORATOR);

  const decorator = decorators[0];

  let decoratorArg: ts.Expression | undefined;
  if (ts.isCallExpression(decorator.expression)) decoratorArg = decorator.expression.arguments[0];

  if (decoratorArg && !ts.isStringLiteral(decoratorArg))
    throw new Error(`[vue-property-decorator] Expected @${DECORATOR} to be a string literal`);

  const refAlias = decoratorArg ? decoratorArg.getText() : undefined;
  const refName = prop.name.getText();
  const refType = prop.type ? cloneNode(prop.type) : undefined;
  const refExpr = createCallExpression("ref", refType, []);

  const refConst = createConstStatement(refName, refExpr);

  if (refAlias) {
    addTodoComment(
      refConst,
      `Update template, replace 'ref="${refAlias}"' with 'ref="${refName}"'`,
    );
  }

  return {
    shouldContinue: false,
    result: {
      kind: VxResultKind.COMPOSITION,
      tag: "TemplateRef",
      imports: [],
      outputVariables: [refName],
      reference: VxReferenceKind.VARIABLE_VALUE,
      nodes: [refConst],
      typeProperties: [],
    },
  };
};

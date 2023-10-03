import {
  createCallExpression,
  createConstStatement,
  getDecorators,
  isObjLitExpr,
  isStringLit,
} from "@/helpers/tsHelpers.js";
import { namedImports } from "@/helpers/utils.js";
import { registerDecorator } from "@/transformer/registry.js";
import { VxReferenceKind, VxResultKind, VxTransform } from "@/types.js";
import { cloneNode } from "ts-clone-node";
import ts from "typescript";

const DECORATOR = "Inject";

export const transformDecoratorInject: VxTransform<ts.PropertyDeclaration> = (node, program) => {
  if (!ts.isPropertyDeclaration(node)) return { shouldContinue: true };

  const decorators = getDecorators(node, DECORATOR);

  if (!decorators || decorators.length <= 0) return { shouldContinue: true };
  if (decorators.length > 1)
    throw new Error(
      `[vue-property-decorator] Duplicate @${DECORATOR} decorators for ${node.name.getText()}`,
    );

  registerDecorator(DECORATOR);

  const decorator = decorators[0];
  let decoratorArg: ts.Expression | undefined;
  if (ts.isCallExpression(decorator.expression)) decoratorArg = decorator.expression.arguments[0];

  let injectStatement: ts.Statement | undefined;
  let injectName: string | undefined;
  let defaultVal: ts.Expression | undefined = undefined;

  const localName = node.name.getText();
  const properties = isObjLitExpr(decoratorArg) ? decoratorArg.properties : undefined;

  if (properties) ({ injectName, defaultVal } = parseOptions(properties));
  if (!injectName) injectName = isStringLit(decoratorArg) ? decoratorArg.text : localName;

  injectStatement = createInject(injectName, localName, defaultVal);

  return {
    shouldContinue: false,
    result: {
      kind: VxResultKind.COMPOSITION,
      tag: "Inject",
      imports: namedImports(["inject"]),
      outputVariables: [localName],
      reference: VxReferenceKind.NONE,
      nodes: [injectStatement],
    },
  };
};

type InjectOptions = { injectName?: string; defaultVal?: ts.Expression };
function parseOptions(properties: ts.NodeArray<ts.ObjectLiteralElementLike>) {
  const options = properties.reduce(
    (acc, prop) => {
      if (!ts.isPropertyAssignment(prop)) return acc;

      const propertyName = prop.name.getText();
      if (propertyName === "from") acc.injectName = prop.initializer.getText();
      if (propertyName === "default") acc.defaultVal = cloneNode(prop.initializer);

      return acc;
    },
    { injectName: undefined, defaultVal: undefined } as InjectOptions,
  );

  return options;
}

function createInject(key: string, localAlias: string, defaultValue: ts.Expression | undefined) {
  const injectId = ts.factory.createStringLiteral(key);
  const defaultVal = defaultValue ? [defaultValue] : [];
  const injectExpr = createCallExpression("inject", undefined, [injectId, ...defaultVal]);
  const statement = createConstStatement(localAlias, injectExpr);
  return statement;
}

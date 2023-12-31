import { createIdentifier, getDecorators } from "@/helpers/tsHelpers.js";
import { registerDecorator } from "@/registry.js";
import { VxReferenceKind, VxResultKind, VxResultToMacro, VxTransform } from "@/types.js";
import { cloneNode } from "ts-clone-node";
import ts from "typescript";
import { instancePropertyKeyMap } from "../utils/instancePropertyAccess.js";
import { processPropMetadata } from "../utils/processPropsMetadata.js";
import { ctorToType, unknownKeyword } from "../vue-class-component/decorator-options/ctorToType.js";

const DECORATOR = "Prop";

export const transformDecoratorProp: VxTransform<ts.PropertyDeclaration> = (prop, program) => {
  if (!ts.isPropertyDeclaration(prop)) return { shouldContinue: true };

  const propName = prop.name.getText();
  const decorators = getDecorators(prop, DECORATOR);

  if (!decorators || decorators.length <= 0) return { shouldContinue: true };
  if (decorators.length > 1)
    throw new Error(`[vue-property-decorator] Duplicate @${DECORATOR} decorators for ${propName}`);

  registerDecorator(DECORATOR);

  const decorator = decorators[0];
  const propType = prop.type ? cloneNode(prop.type) : undefined;

  let decoratorArg: ts.Expression | undefined;
  if (ts.isCallExpression(decorator.expression)) {
    decoratorArg = decorator.expression.arguments[0];
  }

  let typeProperties: VxResultToMacro["typeProperties"] = [];
  let defaults: ts.PropertyAssignment[] = [];

  if (decoratorArg && ts.isObjectLiteralExpression(decoratorArg)) {
    const { type, optional, default: def } = processPropMetadata(decoratorArg.properties);

    typeProperties = [[propName, propType ?? type, optional]];
    defaults = def ? [ts.factory.createPropertyAssignment(propName, def)] : [];
  } else if (decoratorArg && ts.isArrayLiteralExpression(decoratorArg)) {
    const types = decoratorArg.elements.map((e) => {
      if (!ts.isIdentifier(e)) return unknownKeyword();
      const getTypeNode = ctorToType.get(e.getText());
      if (!getTypeNode) return unknownKeyword();
      return getTypeNode();
    });
    typeProperties = [[propName, ts.factory.createUnionTypeNode(types)]];
  } else {
    typeProperties.push([propName, propType ?? unknownKeyword()]);
  }

  const propertyAccess = ts.factory.createPropertyAccessExpression(
    createIdentifier("props"),
    createIdentifier(propName),
  );
  instancePropertyKeyMap.set(propName, propertyAccess);

  return {
    shouldContinue: false,
    result: {
      kind: VxResultKind.MACRO,
      tag: "Macro-defineProps",
      imports: [],
      outputVariables: ["props", propName],
      reference: VxReferenceKind.DEFINABLE_VARIABLE,
      nodes: defaults,
      typeProperties,
    },
  };
};

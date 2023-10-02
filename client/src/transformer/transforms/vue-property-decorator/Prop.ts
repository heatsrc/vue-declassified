import { getDecorator } from "@/helpers/tsHelpers.js";
import { VxReferenceKind, VxResultKind, VxResultToMacro, VxTransform } from "@/types.js";
import { cloneNode } from "ts-clone-node";
import ts from "typescript";
import { processPropMetadata } from "../utils/processPropsMetadata.js";
import { unknownKeyword } from "../vue-class-component/decorator-options/ctorToType.js";

const DECORATOR = "Prop";

export const transformPropDecorator: VxTransform<ts.PropertyDeclaration> = (prop, program) => {
  if (!ts.isPropertyDeclaration(prop)) return { shouldContinue: true };

  const propName = prop.name.getText();
  const decorator = getDecorator(prop, DECORATOR);

  if (!decorator) return { shouldContinue: true };

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
  } else {
    typeProperties.push([propName, propType ?? unknownKeyword()]);
  }

  return {
    shouldContinue: false,
    result: {
      kind: VxResultKind.MACRO,
      tag: "Macro-defineProps",
      imports: [],
      outputVariables: ["props"],
      reference: VxReferenceKind.DEFINABLE_VARIABLE,
      nodes: defaults,
      typeProperties,
    },
  };
};

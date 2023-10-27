import ts from "typescript";
import { VuexPropertyTypeBase } from "./vuexClass.types";

export function isValidVuexNsKey(
  expr: ts.Node | undefined,
): expr is ts.StringLiteral | ts.Identifier {
  return !!expr && (ts.isIdentifier(expr) || ts.isStringLiteral(expr));
}

export function isValidVuexDecoratorArg(
  arg: ts.Node | string | undefined,
): arg is VuexPropertyTypeBase {
  return (
    typeof arg !== "undefined" &&
    (typeof arg === "string" ||
      ts.isStringLiteral(arg) ||
      ts.isIdentifier(arg) ||
      ts.isPropertyAccessExpression(arg) ||
      ts.isBinaryExpression(arg))
  );
}

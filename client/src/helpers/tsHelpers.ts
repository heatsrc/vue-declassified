import ts, { factory } from "typescript";
import { isString } from "./utils.js";

export function getDecoratorNames(node: ts.Node) {
  if (!ts.canHaveDecorators(node)) return [];

  const decorators = ts.getDecorators(node) ?? [];
  return decorators.map((decorator) =>
    ts.isCallExpression(decorator.expression)
      ? decorator.expression.expression.getText()
      : decorator.expression.getText(),
  );
}

export function getPackageName(node: ts.Node) {
  if (!ts.isImportDeclaration(node)) return undefined;

  const moduleSpecifier = node.moduleSpecifier;
  if (!ts.isStringLiteral(moduleSpecifier)) return undefined;

  return moduleSpecifier.text;
}

export function createIdentifier(name: string) {
  return factory.createIdentifier(name);
}

export function createCallExpression(
  expression: string | ts.Identifier | ts.PropertyAccessExpression,
  type?: ts.TypeNode,
  args?: ts.Expression[],
) {
  const expr = isString(expression) ? createIdentifier(expression) : expression;
  const typeRef = type
    ? [ts.factory.createTypeReferenceNode(createIdentifier(type.getText()))]
    : undefined;
  return factory.createCallExpression(expr, typeRef, args);
}

export function createArrowFunction(
  node: ts.MethodDeclaration | ts.AccessorDeclaration,
  statements?: ts.Statement[],
  multiline?: boolean,
) {
  const { body, parameters, type, typeParameters } = node;
  const modifiers = ts.getModifiers(node);
  const rocket = factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken);
  const fnBody = statements
    ? factory.createBlock(statements, multiline)
    : body ?? factory.createBlock([], multiline);

  return factory.createArrowFunction(modifiers, typeParameters, parameters, type, rocket, fnBody);
}

export function createObjectLiteral(
  props: [key: string, value: string | boolean | number | RegExp | bigint | ts.Expression][],
) {
  const propAssignment = props.reduce((acc, [key, val]) => {
    let value: ts.Expression;
    if (typeof val === "object" && "kind" in val) value = val;
    else value = getLiteralFromValue(val);

    const propertyAssignment = factory.createPropertyAssignment(key, value);
    acc.push(propertyAssignment);
    return acc;
  }, [] as ts.PropertyAssignment[]);

  return factory.createObjectLiteralExpression(propAssignment, true);
}

export function getLiteralFromValue(val: string | boolean | number | RegExp | bigint) {
  if (typeof val === "string") return factory.createStringLiteral(val);
  if (typeof val === "boolean") return val ? factory.createTrue() : factory.createFalse();
  if (typeof val === "number") return factory.createNumericLiteral(val);
  if (typeof val === "bigint") return factory.createBigIntLiteral(val + "");
  if (val instanceof RegExp) return factory.createRegularExpressionLiteral(val + "");
  throw new Error(`Unknown value type: ${typeof val}`);
}

export function isPrimitiveType({ flags }: ts.Type) {
  return (
    !!(flags & ts.TypeFlags.NumberLike) ||
    !!(flags & ts.TypeFlags.StringLike) ||
    !!(flags & ts.TypeFlags.BooleanLike) ||
    !!(flags & ts.TypeFlags.Null) ||
    !!(flags & ts.TypeFlags.Undefined)
  );
}

export function createConstStatement(
  name: string | ts.BindingName,
  expression?: ts.Expression,
  type?: ts.TypeNode,
) {
  return createVariableStatement(ts.NodeFlags.Const, name, expression, type);
}
export function createLetStatement(
  name: string | ts.BindingName,
  expression?: ts.Expression,
  type?: ts.TypeNode,
) {
  return createVariableStatement(ts.NodeFlags.Let, name, expression, type);
}

function createVariableStatement(
  flag: ts.NodeFlags,
  name: string | ts.BindingName,
  expression?: ts.Expression,
  type?: ts.TypeNode,
) {
  return factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [factory.createVariableDeclaration(name, undefined, type, expression)],
      flag,
    ),
  );
}

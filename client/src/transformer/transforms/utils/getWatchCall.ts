import { createIdentifier, isFunctionExpressionLike } from "@/helpers/tsHelpers.js";
import ts from "typescript";

const {
  createArrowFunction,
  createCallExpression,
  createExpressionStatement,
  createObjectLiteralExpression,
  createPropertyAccessChain,
  createPropertyAssignment,
  createToken,
  createTrue,
  createThis,
} = ts.factory;

const u = undefined;

export type WatchSource = string | ts.Identifier | ts.ArrowFunction | ts.FunctionExpression;
type WatchHandlerBase = string | ts.Identifier | ts.FunctionExpression | ts.ArrowFunction;
type WatchHandlerObject = {
  handler: WatchHandlerBase;
  immediate?: boolean;
  deep?: boolean;
};
export type WatchHandler = WatchHandlerBase | WatchHandlerObject;

export function convertInitializerToWatchHandlers(initializer: ts.Expression, recursing?: boolean) {
  if (ts.isStringLiteral(initializer)) return [initializer.text] as WatchHandler[];
  if (isFunctionExpressionLike(initializer)) return [initializer] as WatchHandler[];
  if (ts.isObjectLiteralExpression(initializer)) {
    const watchHandlerObj = initializer.properties.reduce((acc, prop) => {
      if (!ts.isPropertyAssignment(prop)) return acc;
      const name = prop.name.getText();
      const initializer = prop.initializer;
      if (name === "handler") {
        if (ts.isStringLiteral(initializer)) acc.handler = initializer.text;
        if (isFunctionExpressionLike(initializer) || ts.isIdentifier(initializer))
          acc.handler = initializer;
      }

      const isTrue = initializer.kind === ts.SyntaxKind.TrueKeyword;
      if (name === "immediate" && isTrue) acc.immediate = true;
      if (name === "deep" && isTrue) acc.deep = true;

      return acc;
    }, {} as WatchHandlerObject);
    return [watchHandlerObj];
  }
  if (!recursing && ts.isArrayLiteralExpression(initializer)) {
    return initializer.elements.reduce((acc, el) => {
      const validElements =
        ts.isStringLiteral(el) || isFunctionExpressionLike(el) || ts.isObjectLiteralExpression(el);
      if (!validElements) return acc;

      const handlers = convertInitializerToWatchHandlers(el, true);
      acc.push(...handlers);
      return acc;
    }, [] as WatchHandler[]);
  }
  return [] as WatchHandler[];
}
/**
 * Converts watch options, because Vue 3 watch does not take an array of
 * callbacks we need to convert them into multiple watch calls
 *
 * @param watchSource
 * @param watchHandlers
 * @returns
 */
export function getOptionWatchCalls(watchSource: WatchSource, watchHandlers: WatchHandler[]) {
  let source: Exclude<typeof watchSource, string>;
  if (typeof watchSource !== "string") {
    source = watchSource;
  } else {
    source = convertWatchSource(watchSource);
  }

  const handlers = watchHandlers.map((watchHandler) => {
    let { handler, options } = convertWatchHandler(watchHandler);

    if (typeof handler === "string") handler = createIdentifier(handler);

    const args: ts.Expression[] = [source, handler];
    if (options) args.push(options);

    const watchId = createIdentifier("watch");
    const watchCallExpr = createCallExpression(watchId, u, args);
    const watchExpression = createExpressionStatement(watchCallExpr);
    return watchExpression;
  });

  return handlers;
}

/**
 * If an identified is a string containing dots (e.g., "a.b.c"), then it will be
 * converted to a getter returning a property access chain (e.g., () => a?.b?.c)
 *
 * @param identifier
 * @returns
 */
function convertWatchSource(identifier: string) {
  const identifiers = identifier.split(".");
  // We don't add `this` like in the arrow function below because watch expects
  // a `Ref<T>` so we don't want post transform to convert it to
  // `<identifier>.value`
  if (identifiers.length <= 1) return createIdentifier(identifier);

  function buildPropertyAccess(left: ts.PropertyAccessChain, remaining: string[]) {
    if (remaining.length <= 0) return left as ts.PropertyAccessChain;
    const right = remaining.shift()!;
    const dDot = createToken(ts.SyntaxKind.QuestionDotToken);
    left = createPropertyAccessChain(left, dDot, createIdentifier(right));
    return buildPropertyAccess(left, remaining);
  }

  const firstId = createIdentifier(identifiers.shift()!);
  // NOTE: It seems counter intuitive to add a `this` here but it will be caught in
  // the post transformer and property converted to `.value` if appropriate
  const leftChain = createPropertyAccessChain(createThis(), u, firstId);
  const propertyAccess = buildPropertyAccess(leftChain, identifiers);
  const rocket = createToken(ts.SyntaxKind.EqualsGreaterThanToken);

  return createArrowFunction(u, u, [], u, rocket, propertyAccess);
}

/**
 * Converts a Vue 2 watch handler with options to something we can use in the new
 * Vue 3 watch call signature
 * @param wh
 * @returns
 */
function convertWatchHandler(wh: WatchHandler) {
  let options: ts.ObjectLiteralExpression | undefined;

  if (!(typeof wh !== "string" && "handler" in wh)) return { handler: wh, options };
  if (!wh.immediate && !wh.deep) return { handler: wh.handler, options };

  const immediate = wh.immediate ? createPropertyAssignment("immediate", createTrue()) : u;
  const deep = wh.deep ? createPropertyAssignment("deep", createTrue()) : u;
  const elements = [immediate, deep].filter((el): el is ts.PropertyAssignment => !!el);
  options = createObjectLiteralExpression(elements);
  return { handler: wh.handler, options };
}

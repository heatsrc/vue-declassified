/**
 * Determines if a given identifier can be used in a property access expression
 * or if it needs to use an element access expression.
 * @param identifier
 * @returns
 */
export function isValidIdentifier(identifier: unknown) {
  return (
    typeof identifier === "string" &&
    /^[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/.test(identifier)
  );
}

export function isValidIdentifier(identifier: unknown) {
  return (
    typeof identifier === "string" &&
    /^[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/.test(identifier)
  );
}

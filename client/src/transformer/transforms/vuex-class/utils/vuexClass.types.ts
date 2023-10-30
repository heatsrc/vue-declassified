import ts from "typescript";

/**
 * - `string` indicates that the class property name is being used as the store property name
 * ```ts
 *    ⁣@Getter() foo: boolean; // string : 'foo'
 * ```
 * - `Identifier` indicates that a variable has been passed as a parameter to the decorator
 * ```ts
 *    ⁣@Getter(bar) foo: boolean; // Identifier : bar
 * ```
 * - `StringLiteral` indicates that a string has been passed as a parameter to the decorator
 * ```ts
 *    ⁣@Getter('bar') foo: boolean; // StringLiteral : 'bar'
 * ```
 * - `BinaryExpression` indicates that a string concatenation has been passed as a parameter to the decorator
 * ```ts
 *    ⁣@Getter('foo/' + bar) foo: boolean; // BinaryExpression : 'foo/' + bar
 * ```
 */
export type VuexPropertyTypeBase =
  | string
  | ts.Identifier
  | ts.StringLiteral
  | ts.BinaryExpression
  | ts.PropertyAccessExpression;

/**
 * - `string` indicates that the class property name is being used as the store property name
 * ```ts
 *    ⁣@State() foo: boolean; // string : 'foo'
 * ```
 * - `Identifier` indicates that a variable has been passed as a parameter to the decorator
 * ```ts
 *    ⁣@State(bar) foo: boolean; // Identifier : bar
 * ```
 * - `StringLiteral` indicates that a string has been passed as a parameter to the decorator
 * ```ts
 *    ⁣@State('bar') foo: boolean; // StringLiteral : 'bar'
 * ```
 * - `BinaryExpression` indicates that a string concatenation has been passed as a parameter to the decorator
 * ```ts
 *    ⁣@State('foo/' + bar) foo: boolean; // BinaryExpression : 'foo/' + bar
 * ```
 * - `ArrowFunction` indicates that an arrow function has been passed as a parameter to the decorator
 * ```ts
 *    ⁣@State(s => s.foo.bar) foo: boolean; // ArrowFunction : s => s.foo.bar
 * ```
 */
export type VuexStatePropertyType = VuexPropertyTypeBase | ts.ArrowFunction;

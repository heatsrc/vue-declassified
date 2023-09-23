import {
  createCallExpression,
  createConstStatement,
  createIdentifier,
} from "@/helpers/tsHelpers.js";
import { VxTransformResult, VxResultKind, VxReferenceKind } from "@/types.js";
import ts from "typescript";

export const transformResults: VxTransformResult<ts.Node>[] = [
  {
    kind: VxResultKind.COMPOSITION,
    reference: VxReferenceKind.NONE,
    outputVariables: [],
    tag: "foo",
    nodes: [
      createConstStatement(
        "a",
        createCallExpression("ref", undefined, [ts.factory.createStringLiteral("a")]),
      ),
      createConstStatement(
        "b",
        createCallExpression("reactive", undefined, [createIdentifier("foo")]),
      ),
      createConstStatement(
        ts.factory.createObjectBindingPattern([
          ts.factory.createBindingElement(undefined, undefined, "c"),
        ]),
        createIdentifier("bar"),
      ),
    ],
    imports: [
      {
        named: ["ref"],
        external: "vue",
      },
      {
        path: "./foo",
        default: "foo",
        named: ["bar"],
      },
    ],
  },
  {
    kind: VxResultKind.COMPOSITION,
    reference: VxReferenceKind.NONE,
    outputVariables: [],
    tag: "foo",
    nodes: [],
    imports: [
      {
        default: "MyComponent",
        path: "./MyComponent.vue",
      },
    ],
  },
];

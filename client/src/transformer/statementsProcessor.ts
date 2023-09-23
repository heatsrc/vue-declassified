import ts from "typescript";
import { classTransforms } from "./config.js";
import { addTodoComment } from "../helpers/comments.js";
import {
  VxTransformResult,
  VxResultKind,
  VxReferenceKind,
  VxResultToOptions,
  VxTransform,
  VxClassMemberTransforms,
} from "../types.js";

const {
  [ts.SyntaxKind.Decorator]: decoratorTransforms,
  after,
  ...classMemberTransforms
} = classTransforms;

export function processClassMember(
  member: ts.Node,
  program: ts.Program,
  transforms = classMemberTransforms,
) {
  type TransformKeys = keyof VxClassMemberTransforms;
  function isTransformable(sk: ts.SyntaxKind): sk is TransformKeys {
    return sk in transforms && sk !== ts.SyntaxKind.Decorator;
  }

  if (!isTransformable(member.kind)) return false;

  const memberTransforms = transforms[member.kind];
  return processNode(member, program, memberTransforms);
}

export function processClassDecorator(
  decorator: ts.Decorator,
  program: ts.Program,
  transforms = decoratorTransforms,
) {
  const options = getDecoratorOptions(decorator);
  if (!options) return false;

  let results: VxTransformResult<ts.Node>[] = [];

  options.forEachChild((property) => {
    type DecoratorTransforms = keyof typeof transforms;

    function isTransformable(sk: ts.SyntaxKind): sk is DecoratorTransforms {
      return sk in transforms;
    }

    if (isTransformable(property.kind)) {
      const optionTransforms = transforms[property.kind];
      const opts = processNode(property, program, optionTransforms);

      if (opts.length > 0) results.push(...opts);
    } else {
      results.push(processUnknownOption(property));
    }
  });

  return results;
}

function processUnknownOption(node: ts.Node) {
  return {
    imports: [],
    kind: VxResultKind.OPTIONS,
    reference: VxReferenceKind.NONE,
    outputVariables: [],
    tag: "InheritOptions",
    nodes: [addTodoComment(node, `Could not convert unknown option`, false)],
    composables: [],
  } as VxResultToOptions<ts.Node>;
}

// TODO fix this any
function processNode<T>(node: T, program: ts.Program, transforms: VxTransform<any>[]) {
  return transforms.reduce((acc, transform) => {
    const opt = transform(node, program);
    if (!opt) return acc;
    acc.push(opt);
    return acc;
  }, [] as VxTransformResult<ts.Node>[]);
}

function getDecoratorOptions(decorator: ts.Decorator) {
  const decExpr = decorator.expression;
  if (!ts.isCallExpression(decExpr)) return;
  if (decExpr.arguments.length <= 0) return;
  if (!ts.isObjectLiteralExpression(decExpr.arguments[0]))
    throw new Error(`Vue class decorator argument must be an object literal expression`);

  return decExpr.arguments[0];
}

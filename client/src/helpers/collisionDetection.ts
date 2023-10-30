import { instancePropertyKeyMap } from "@/transformer/transforms/utils/instancePropertyAccess.js";
import { VxTransformResult } from "@/types.js";
import Debug from "debug";
import ts from "typescript";
import {
  addCollision,
  getCollisions,
  hasClassBodyVariable,
  hasCollisions,
  isTopLevelVariableRegistered,
  registerClassBodyVariable,
  registerTopLevelVariables,
  registeredVariableTypes,
} from "../registry.js";

const debug = Debug("vuedc:transformer:helpers:collisionDetection");

export function registerTopLevelVars(statements: ts.Statement[]) {
  const imports = statements.filter(ts.isImportDeclaration);
  const variables = statements.filter(ts.isVariableStatement);
  const variableDeclarations = [...variables.map((v) => v.declarationList.declarations)];

  const namedImports = imports
    .map((i) => i.importClause?.namedBindings)
    .filter((nb): nb is ts.NamedImports => !!nb && ts.isNamedImports(nb));

  const defaultImports = imports
    .map((i) => i.importClause?.name)
    .filter((n): n is ts.Identifier => !!n && ts.isIdentifier(n))
    .map((i) => i.text);

  const variableNames = variableDeclarations
    .flatMap((v) =>
      v.flatMap((v) => {
        if (ts.isIdentifier(v.name)) return [v.name.text];
        if (ts.isObjectBindingPattern(v.name) || ts.isArrayBindingPattern(v.name))
          return traverseObjBindings(v.name);
      }),
    )
    .filter((v): v is string => !!v);

  const namedImportsElements = namedImports.flatMap((ni) => ni.elements.map((e) => e.name.text));
  registerTopLevelVariables([...namedImportsElements, ...defaultImports], true);
  registerTopLevelVariables([...variableNames]);
}

function traverseObjBindings(obj: ts.ObjectBindingPattern | ts.ArrayBindingPattern) {
  const names = obj.elements.reduce((acc, e) => {
    if (ts.isOmittedExpression(e)) return acc;
    if (ts.isObjectBindingPattern(e.name) || ts.isArrayBindingPattern(e.name)) {
      acc.push(...traverseObjBindings(e.name));
    } else {
      acc.push(e.name.text);
    }
    return acc;
  }, [] as string[]);

  return names;
}

export function detectNamingCollisions(results: VxTransformResult<ts.Node>[]) {
  debug("Detecting naming collisions");
  results.forEach((result) => {
    result.outputVariables.forEach((name) => {
      if (isTopLevelVariableRegistered(name)) {
        registeredVariableTypes(name).forEach((type) => addCollision(name, result.tag, type));
      }

      if (hasClassBodyVariable(name) && !instancePropertyKeyMap.has(`$${name}`)) {
        debug(`Collision detected for: ${name}`);
        addCollision(name, result.tag, "class body");
      }

      registerClassBodyVariable(name);
    });
  });
}

export function getCollisionsWarning(includeTodo = true) {
  if (!hasCollisions()) return "";

  const c = getCollisions().reduce((acc, [name, { tag, sources }]) => {
    acc += `\n  - \`${name}\` (${tag}) was already defined in: ${[...sources].join(", ")}`;
    return acc;
  }, "");
  return (
    `${includeTodo ? "[VUEDC_TODO] " : ""}Fix naming collisions\n ${c}\n\n` +
    `It is strongly suggested you fix these prior to converting the file.\n` +
    `Usage of these variables may be ambiguous in the converted code.\n\n` +
    `Tips: https://github.com/heatsrc/vue-declassified#naming-collisions\n`
  );
}

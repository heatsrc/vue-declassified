import { addTodoComment } from "@/helpers/comments";
import {
  createCallExpression,
  createConstStatement,
  createPropertyAccess,
} from "@/helpers/tsHelpers";
import { namedImports } from "@/helpers/utils";
import { addGlobalWarning, getImportNameOverride } from "@/registry";
import { VxReferenceKind, VxResultKind, VxResultToComposable, VxTransform } from "@/types";
import Debug from "debug";
import ts from "typescript";
import { instancePropertyKeyMap } from "../utils/instancePropertyAccess";

const debug = Debug("vuedc:transformer:transforms:vue-property-decorator:mixins");
const CLAUSE = "mixins";
const u = undefined;

export const transformMixins: VxTransform<ts.HeritageClause> = (clause, program) => {
  if (!ts.isHeritageClause(clause)) return { shouldContinue: true };
  if (!isExtendsClause(clause)) return { shouldContinue: true };
  if (!clause.types) return { shouldContinue: true };

  const typeExpr = clause.types[0].expression;
  if (!ts.isCallExpression(typeExpr)) return { shouldContinue: true };

  const typeIdent = typeExpr.expression;
  if (!ts.isIdentifier(typeIdent)) return { shouldContinue: true };

  let clauseName = getImportNameOverride(CLAUSE) ?? CLAUSE;
  debug(`Mixin var: ${clauseName}`);
  if (typeIdent.text !== clauseName) return { shouldContinue: true };

  const args = typeExpr.arguments;
  if (!args || args.length <= 0) return { shouldContinue: true };

  const checker = program.getTypeChecker();
  const mixins = args.reduce((acc, arg) => {
    if (!ts.isIdentifier(arg)) return acc;

    debug(`Found Mixin: ${arg.text}`);
    const rest = arg.text.slice(1);
    let name = "use" + arg.text.charAt(0).toUpperCase() + rest;
    name = name.replace("Mixin", "");

    const type = checker.getSymbolAtLocation(arg);
    if (!type) debug(`Could not find type for mixin: ${arg.text}`);
    const decl = type?.declarations?.[0];
    debug(`Creating composable from mixin: ${name}`);
    if (!decl) {
      debug(`Could not find declaration for mixin: ${arg.text}`);
      return acc;
    }

    let moduleSpecifier: ts.StringLiteral | undefined;
    let parent = decl.parent;
    while (parent && !moduleSpecifier) {
      if (ts.isImportDeclaration(parent)) {
        moduleSpecifier = parent.moduleSpecifier as ts.StringLiteral;
      }
      parent = parent.parent;
    }

    if (!moduleSpecifier) {
      debug(`Could not find module specifier for mixin: ${arg.text}`);
      return acc;
    }

    let importFileName = moduleSpecifier.text;
    debug(`Import file name: ${importFileName}`);
    addGlobalWarning(
      `Mixin "${arg.text}" was assumed to have composable "${name}" in the same file and public members mapped 1:1 with exported variables/functions.`,
    );

    const mixinClass = checker.getTypeOfSymbolAtLocation(type, arg).symbol.valueDeclaration;
    if (!mixinClass || !ts.isClassDeclaration(mixinClass)) return acc;

    debug(`Getting public members of mixin: ${mixinClass.name?.text}`);
    let referenceVars: string[] = [];
    const bindingElements = mixinClass.members.reduce((acc, member) => {
      if (
        !ts.isPropertyDeclaration(member) &&
        !ts.isMethodDeclaration(member) &&
        !ts.isAccessor(member)
      ) {
        return acc;
      }

      if (member.modifiers?.some((m) => m.kind === ts.SyntaxKind.PrivateKeyword)) return acc;

      const memberName = member.name.getText();
      const memberVal = ts.isPropertyDeclaration(member)
        ? createPropertyAccess(memberName, "value")
        : memberName;

      debug(`Adding member to instancePropertyKeyMap: ${memberName}`);
      instancePropertyKeyMap.set(memberName, memberVal);
      referenceVars.push(memberName);

      const bindingElement = ts.factory.createBindingElement(u, u, memberName);
      acc.push(bindingElement);

      return acc;
    }, [] as ts.BindingElement[]);

    const bindingPattern = ts.factory.createObjectBindingPattern(bindingElements);
    const callExpr = createCallExpression(name);
    const constStatement = createConstStatement(bindingPattern, callExpr);
    addTodoComment(constStatement, "Check this is correct. ");

    acc.push({
      kind: VxResultKind.COMPOSABLE,
      reference: VxReferenceKind.DEFINABLE_VARIABLE,
      tag: `Composable-fromMixin-${name}`,
      outputVariables: [name, ...referenceVars],
      imports: namedImports([name], importFileName),
      nodes: [constStatement],
    });

    return acc;
  }, [] as VxResultToComposable[]);

  return { shouldContinue: false, result: mixins };
};

function isExtendsClause(clause: ts.HeritageClause) {
  return clause.token === ts.SyntaxKind.ExtendsKeyword;
}

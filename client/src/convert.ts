import ts from "typescript";
import { getDecoratorNames, getPackageName } from "./helpers/tsHelpers.js";
import { runTransforms } from "./transformer.js";

const vccPackages = ["vue-class-component", "vue-property-decorator", "vuex-class"];

export function convertAst(source: ts.SourceFile, program: ts.Program) {
  if (!hasVccImports(source)) throw new Error("No vue class component import found in this file");

  const defaultExportNode = getDefaultExportNode(source);
  if (!defaultExportNode) throw new Error("No default export found in this file");

  let resultStatements = [
    ...getOtherStatements(source),
    ...runTransforms(defaultExportNode, program),
  ];

  // Group imports at start
  resultStatements = [
    ...resultStatements.filter((s) => ts.isImportDeclaration(s)),
    ...resultStatements.filter((s) => !ts.isImportDeclaration(s)),
  ];

  const printer = ts.createPrinter();
  const newSourceFile = ts.factory.updateSourceFile(source, resultStatements);
  const result = printer.printFile(newSourceFile);
  return result;
}

function getOtherStatements(source: ts.SourceFile) {
  const unwantedStatements = (s: ts.Statement) => {
    if (ts.isClassDeclaration(s) && getDecoratorNames(s)) return true;
    const pkg = getPackageName(s);
    if (pkg && vccPackages.includes(pkg)) return true;
    if (pkg === "vue") return true;
  };

  return source.statements.map((el) => el).filter((el) => !unwantedStatements(el));
}

function hasVccImports(source: ts.SourceFile) {
  return source.statements.find((s) => {
    if (!ts.isImportDeclaration(s)) return false;
    if (!vccPackages.includes((s.moduleSpecifier as ts.StringLiteral).text)) return false;
    return true;
  });
}

function getDefaultExportNode(sourceFile: ts.SourceFile) {
  const classes = sourceFile.statements.filter((s): s is ts.ClassDeclaration =>
    ts.isClassDeclaration(s),
  );
  const defExport = classes.find(
    (c) => c.modifiers?.find((m) => m.kind === ts.SyntaxKind.DefaultKeyword),
  );

  if (!defExport) return;

  const decorators = getDecoratorNames(defExport);
  if (!decorators?.some((d) => /(Options|Component)/.test(d))) return;

  return defExport;
}

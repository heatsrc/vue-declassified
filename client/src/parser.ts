import ts from "typescript";

const compilerOptions: ts.CompilerOptions = {
  allowNonTsExtensions: true,
  allowJs: true,
  checkJs: true,
  noEmit: true,
};

/**
 * Convert string to TypeScript AST
 * @param content Vue script content
 * @returns AST and TS Program
 */
export function getSingleFileProgram(content: string) {
  const filename = "ast.ts";
  /* c8 ignore start */
  const compilerHost: ts.CompilerHost = {
    fileExists: (path: string) => path.includes(filename),
    getCanonicalFileName: () => filename,
    getCurrentDirectory: () => "",
    getDirectories: () => [],
    getDefaultLibFileName: () => "lib.d.ts",
    getNewLine: () => "\n",
    getSourceFile: (file: string) =>
      ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true),
    readFile: () => undefined,
    useCaseSensitiveFileNames: () => true,
    writeFile: () => null,
  };
  /* c8 ignore end */

  const program = ts.createProgram(
    [filename],
    { noResolve: true, target: ts.ScriptTarget.Latest, ...compilerOptions },
    compilerHost,
  );
  const ast = program.getSourceFile(filename);
  /* c8 ignore next */
  if (!ast) throw new Error("Can't convert code to TypeScript AST.");
  return { ast, program };
}

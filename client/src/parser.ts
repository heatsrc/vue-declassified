import { createProjectSync, ts } from "@ts-morph/bootstrap";

const compilerOptions: ts.CompilerOptions = {
  allowNonTsExtensions: true,
  allowJs: true,
  checkJs: true,
  noEmit: true,
  noResolve: true,
  target: ts.ScriptTarget.Latest,
};

/**
 * Convert string to TypeScript AST
 * @param content Vue script content
 * @returns AST and TS Program
 */
export function getSingleFileProgram(content: string, basePath = ".", tsConfigFilePath?: string) {
  const project = createProjectSync(
    tsConfigFilePath ? { tsConfigFilePath } : { compilerOptions, useInMemoryFileSystem: true },
  );
  const filePath = `${basePath}/ast.ts`;
  project.createSourceFile(filePath, content);
  const program = project.createProgram();
  const ast = program.getSourceFile(filePath);
  if (!ast) throw new Error("Can't convert code to TypeScript AST.");
  return { ast, program };
}

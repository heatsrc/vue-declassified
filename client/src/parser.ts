import ts from 'typescript';

const compilerOptions: ts.CompilerOptions = {
    allowNonTsExtensions: true,
    allowJs: true,
    checkJs: true,
    noEmit: true,
};

export function getSingleFileProgram(content: string) {
    const filename = 'ast.ts';
    const compilerHost: ts.CompilerHost = {
        fileExists: (path: string) => path.includes(filename),
        getCanonicalFileName: () => filename,
        getCurrentDirectory: () => '',
        getDirectories: () => ([]),
        getDefaultLibFileName: () => 'lib.d.ts',
        getNewLine: () => "\n",
        getSourceFile: (file: string) => ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true),
        readFile: () => undefined,
        useCaseSensitiveFileNames: () => true,
        writeFile: () => null,
    };

    const program = ts.createProgram([filename], { noResolve: true, target: ts.ScriptTarget.Latest, ...compilerOptions }, compilerHost);
    const ast = program.getSourceFile(filename);
    if (!ast) throw new Error("Can't convert code to TypeScript AST.");
    return { ast, program };
} 

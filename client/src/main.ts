import * as prettier from "prettier";
import * as parserTypescript from "prettier/parser-typescript";
import * as parserEsTree from "prettier/plugins/estree.js";
import ts from "typescript";
import { convertAst } from "./convert.js";
import { readVueFile, writeVueFile } from "./file.js";
import { getCollisionsWarning } from "./helpers/collisionDetection.js";
import { getSingleFileProgram } from "./parser.js";
import { hasCollisions, resetRegistry } from "./registry.js";

export type VuedcOptions = {
  /** When true Vuedc will not "write" the vue file and instead return the variable collisions */
  stopOnCollisions?: boolean;
  /**
   * When provided will use the compiler options from this file rather than
   * simple defaults.
   *
   * Note: Unless you need external file references, it's recommended not
   * providing this. Using your project can be *significantly* slower as TS will
   * need to compile your entire project and uses the file system rather than an
   * in-memory file system when no project is provided.
   */
  tsConfigPath?: string;
};

export class VuedcError extends Error {
  constructor(collisions: string) {
    super();
    this.message = collisions;
  }
}

const defaultOptions: VuedcOptions = {
  stopOnCollisions: false,
};

/**
 * Convert a Vue SFC file containing Vue Class Component to Script Setup syntax
 * @param src source file path to convert
 */
export async function convertSfc(src: string, opts: Partial<VuedcOptions> = {}) {
  const { script, vueFile } = await readVueFile(src);
  const results = await convertScript(script.content, opts);
  const fileContent = await writeVueFile(vueFile, results);
  return fileContent;
}

/**
 * Accepts a Vue SFC Script body in string format and returns the converted Script Setup syntax
 * @param src A single file containing a Vue Class Component
 * @returns Converted Script Setup syntax
 */
export async function convertScript(src: string, opts: Partial<VuedcOptions> = {}) {
  let compilerOptions: ts.CompilerOptions | undefined;
  let tsConfigPath = "";
  if (opts.tsConfigPath) {
    const pathParts = opts.tsConfigPath.split("/");
    const fileName = pathParts.pop();
    const searchPathStart = pathParts.join("/");
    const configFile = ts.findConfigFile(searchPathStart, ts.sys.fileExists, fileName);
    if (configFile) tsConfigPath = configFile;
  }
  const { ast, program } = getSingleFileProgram(src, tsConfigPath);
  const result = convertAst(ast, program);

  if (opts.stopOnCollisions && hasCollisions()) {
    throw new VuedcError(getCollisionsWarning(false));
  }

  let warnings = getCollisionsWarning();
  warnings = warnings ? `\n/*\n${warnings}\n*/\n\n` : "";

  const formattedResult = await prettier.format(warnings + result, {
    parser: "typescript",
    printWidth: 100,
    plugins: [parserTypescript, parserEsTree],
  });

  resetRegistry();

  return formattedResult;
}

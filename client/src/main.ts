import Debug from "debug";
import * as prettier from "prettier";
import * as parserTypescript from "prettier/parser-typescript";
import * as parserEsTree from "prettier/plugins/estree.js";
import ts from "typescript";
import { convertAst } from "./convert.js";
import { readVueFile, writeVueFile } from "./file.js";
import { getCollisionsWarning } from "./helpers/collisionDetection.js";
import { getSingleFileProgram } from "./parser.js";
import { getGlobalWarnings, hasCollisions, resetRegistry } from "./registry.js";

const debug = Debug("vuedc");

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
  basePath?: string;
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
  debug("Finished converting sfc");
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
  if (opts.basePath) {
    const configFile = ts.findConfigFile(opts.basePath, ts.sys.fileExists, "tsconfig.json");
    debug(`Using basePath to look for tsconfig.json: ${opts.basePath}, found ${configFile}`);
    if (configFile) tsConfigPath = configFile;
  }
  const { ast, program } = getSingleFileProgram(src, opts.basePath, tsConfigPath);
  const result = convertAst(ast, program);

  if (opts.stopOnCollisions && hasCollisions()) {
    throw new VuedcError(getCollisionsWarning(false));
  }

  let warnings = getCollisionsWarning();
  const globalWarnings = getGlobalWarnings();
  warnings += globalWarnings.length > 0 ? `\n - ${globalWarnings.join("\n - ")}\n` : "";
  warnings = warnings ? `\n/*\n${warnings}\n*/\n\n` : "";

  debug("Formatting result");
  const formattedResult = await prettier.format(warnings + result, {
    parser: "typescript",
    printWidth: 100,
    plugins: [parserTypescript, parserEsTree],
  });

  resetRegistry();

  debug("Finished converting script");
  return formattedResult;
}

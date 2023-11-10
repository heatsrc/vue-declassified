import Debug from "debug";
import * as prettier from "prettier";
import * as parserTypescript from "prettier/parser-typescript";
import * as parserEsTree from "prettier/plugins/estree.js";
import ts from "typescript";
import { convertDefaultClassComponent, convertMixinClassComponents } from "./convert.js";
import { readVueFile, writeVueFile } from "./file.js";
import { getCollisionsWarning } from "./helpers/collisionDetection.js";
import { getSingleFileProgram } from "./parser.js";
import {
  getGlobalWarnings,
  hasCollisions,
  isMixin,
  resetRegistry,
  setIsMixin,
} from "./registry.js";

const debug = Debug("vuedc");

export type VuedcOptions = {
  /**
   * When true Vuedc will not stringify the final vue file and instead return
   * the variable collisions
   */
  stopOnCollisions?: boolean;
  /**
   * When provided Vuedc will attempt to find a tsconfig.json project file along
   * the path. If found it will use the compiler options from this file rather
   * than simple defaults.
   *
   * Note: Unless you need external file references (e.g., mixins), it's
   * recommended not providing this. Using your project can be *significantly*
   * slower as TS will need to compile your entire project and uses the file
   * system rather than an in-memory file system when no project is provided.
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
 * Takes a TypeScript file creates a composable analogue of any mixins found in
 * the file
 *
 * @param src
 * @param opts
 */
export async function convertMixin(src: string, opts: Partial<VuedcOptions> = {}) {
  setIsMixin();
  const results = await convertScript(src, opts);
  debug("Finished converting mixin");
  return results;
}

/**
 * Accepts a Vue SFC Script body in string format and returns the converted
 * Script Setup syntax
 * @param src A single file containing a Vue Class Component
 * @returns Converted Script Setup syntax
 */
export async function convertScript(src: string, opts: Partial<VuedcOptions> = {}) {
  let tsConfigPath = "";
  if (opts.basePath) {
    const configFile = ts.findConfigFile(opts.basePath, ts.sys.fileExists, "tsconfig.json");
    debug(`Using basePath to look for tsconfig.json: ${opts.basePath}, found ${configFile}`);
    if (configFile) tsConfigPath = configFile;
  }
  const { ast, program } = getSingleFileProgram(src, opts.basePath, tsConfigPath);

  let result: string | undefined;
  if (!isMixin()) {
    result = convertDefaultClassComponent(ast, program);
  } else {
    result = convertMixinClassComponents(ast, program);
  }

  if (opts.stopOnCollisions && hasCollisions()) {
    throw new VuedcError(getCollisionsWarning(false));
  }

  let warnings = getCollisionsWarning();
  const globalWarnings = getGlobalWarnings();
  warnings += globalWarnings.length > 0 ? `\nWarnings:\n - ${globalWarnings.join("\n - ")}\n` : "";
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

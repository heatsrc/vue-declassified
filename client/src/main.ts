import * as prettier from "prettier";
import * as parserTypescript from "prettier/parser-typescript";
import * as parserEsTree from "prettier/plugins/estree.js";
import { convertAst } from "./convert.js";
import { readVueFile, writeVueFile } from "./file.js";
import { getCollisionsWarning } from "./helpers/collisionDetection.js";
import { getSingleFileProgram } from "./parser.js";
import { hasCollisions } from "./registry.js";

export type VuedcOptions = {
  /** When true Vuedc will not "write" the vue file and instead return the variable collisions */
  stopOnCollisions: boolean;
};

class VuedcError extends Error {
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
  const { ast, program } = getSingleFileProgram(src);
  const result = convertAst(ast, program);
  const formattedResult = await prettier.format(result, {
    parser: "typescript",
    printWidth: 100,
    plugins: [parserTypescript, parserEsTree],
  });

  if (opts.stopOnCollisions && hasCollisions()) {
    throw new VuedcError(getCollisionsWarning(false));
  }

  return formattedResult;
}

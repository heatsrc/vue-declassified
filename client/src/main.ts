import prettier from "prettier";
import { convertAst } from "./convert.js";
import { readVueFile, writeVueFile } from "./file.js";
import { getSingleFileProgram } from "./parser.js";

/**
 * Convert a Vue SFC file containing Vue Class Component to Script Setup syntax
 * @param src source file path to convert
 * @param dest (Optional.) destination path to write file to (uses src if not provided)
 */
export async function convertSfc(src: string, dest?: string) {
  const { script, vueFile } = await readVueFile(src);
  const { ast, program } = getSingleFileProgram(script.content);
  const result = convertAst(ast, program);
  const formattedResult = await prettier.format(result, { parser: "typescript", printWidth: 100 });

  writeVueFile(dest ?? src, vueFile, formattedResult);
}

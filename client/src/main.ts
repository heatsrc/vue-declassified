import prettier from "prettier";
import parserTypescript from "prettier/parser-typescript";
import parserEsTree from "prettier/plugins/estree.js";
import { convertAst } from "./convert.js";
import { readVueFile, writeVueFile } from "./file.js";
import { getSingleFileProgram } from "./parser.js";

/**
 * Convert a Vue SFC file containing Vue Class Component to Script Setup syntax
 * @param src source file path to convert
 * @param dest (Optional.) destination path to write file to (uses src if not provided)
 */
export async function convertSfc(src: string) {
  const { script, vueFile } = await readVueFile(src);
  const results = await convertScript(script.content);
  const fileContent = await writeVueFile(vueFile, results);
  return fileContent;
}

/**
 * Accepts a Vue SFC Script body in string format and returns the converted Script Setup syntax
 * @param src A single file containing a Vue Class Component
 * @returns Converted Script Setup syntax
 */
export async function convertScript(src: string) {
  const { ast, program } = getSingleFileProgram(src);
  const result = convertAst(ast, program);
  const formattedResult = await prettier.format(result, {
    parser: "typescript",
    printWidth: 100,
    plugins: [parserTypescript, parserEsTree],
  });
  return formattedResult;
}

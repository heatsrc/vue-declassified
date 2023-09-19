import * as sfcCompiler from "vue/compiler-sfc";
import fs from "fs";
import prettier from "prettier";

function parseSfc(content: string) {
  return sfcCompiler.parse(content);
}
export function readFile(path: string) {
  const content = fs.readFileSync(path, { encoding: "utf8" });
  return parseSfc(content);
}

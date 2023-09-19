import { readFile, writeFile } from "node:fs/promises";
import * as sfcCompiler from "vue/compiler-sfc";

/**
 * Uses vue compiler to parse a vue file
 *
 * @param path file path to read
 * @returns the parsed vue file
 */
export async function readVueFile(path: string) {
  const content = await readFile(path, { encoding: "utf8" });
  const vueFile = sfcCompiler.parse(content);

  if (vueFile.errors.length > 0)
    throw new AggregateError(["Vue file has errors", ...vueFile.errors]);
  if (vueFile.descriptor.scriptSetup) throw new Error("Vue file already has script setup!");
  if (!vueFile.descriptor.script) throw new Error("Vue file has no script!");

  return vueFile;
}

/**
 * Writes a vue file to disk
 *
 * @param path file path to write to
 * @param vueFile Original parsed vue file
 * @param scriptContent Script content to write
 */
export async function writeVueFile(
  path: string,
  vueFile: sfcCompiler.SFCParseResult,
  scriptContent: string,
) {
  if (!vueFile.descriptor.script) throw new Error("Vue file has no script!");

  const lang = vueFile.descriptor.script.lang;

  let fileContent = `<script setup${addLang(lang)}>\n${scriptContent}\n</script>`;
  fileContent += getTemplate(vueFile);
  fileContent += getStyles(vueFile);

  await writeFile(path, fileContent, { encoding: "utf8" });
}

function addLang(lang: string | undefined) {
  return lang ? ` lang="${lang}"` : "";
}

function getTemplate(vueFile: sfcCompiler.SFCParseResult) {
  const template = vueFile.descriptor.template;

  if (!template) return "";

  return `\n\n<template>${template.content}</template>`;
}

function getStyles(vueFile: sfcCompiler.SFCParseResult) {
  const styles = vueFile.descriptor.styles;
  if (!styles.length) return "";

  return styles
    .map((s) => {
      const scoped = s.scoped ? " scoped" : "";
      const lang = addLang(s.lang);

      return `\n\n<style${lang}${scoped}>${s.content}</style>`;
    })
    .join("");
}

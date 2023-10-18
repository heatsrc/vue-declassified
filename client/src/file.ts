import * as sfcCompiler from "vue/compiler-sfc";
import { getCollisionsWarning } from "./helpers/collisionDetection.js";

/**
 * Uses vue compiler to parse a vue file
 *
 * @param content vue file content
 * @returns the parsed vue file
 */
export async function readVueFile(content: string) {
  const vueFile = sfcCompiler.parse(content);

  if (vueFile.errors.length > 0)
    throw new AggregateError([...vueFile.errors], "Vue file has errors");
  if (vueFile.descriptor.scriptSetup) throw new Error("Vue file already has script setup!");
  if (!vueFile.descriptor.script) throw new Error("Vue file has no script!");

  return { script: vueFile.descriptor.script, vueFile };
}

/**
 * Overwrites the script section of a vue file
 *
 * @param vueFile Original parsed vue file
 * @param scriptContent Script content to write
 */
export async function writeVueFile(vueFile: sfcCompiler.SFCParseResult, scriptContent: string) {
  if (!vueFile.descriptor.script) throw new Error("Vue file has no script!");

  const lang = vueFile.descriptor.script.lang;
  let warnings = getCollisionsWarning();
  warnings = warnings ? `\n\n/*\n${warnings}\n*/\n` : "";

  let fileContent = `<script setup${addLang(lang)}>${warnings}\n${scriptContent}\n</script>`;
  fileContent += getTemplate(vueFile);
  fileContent += getStyles(vueFile);

  return fileContent;
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

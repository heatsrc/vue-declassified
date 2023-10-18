import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { readVueFile, writeVueFile } from "../file.js";

describe("test readFile", () => {
  it("test should read a valid vue file", async () => {
    const path = resolve(__dirname, "./fixtures/TestInput.vue");
    const content = await readFile(path, { encoding: "utf8" });

    let { script, vueFile } = await readVueFile(content);

    expect(vueFile.descriptor.script).toBeDefined();
    expect(script).toEqual(vueFile.descriptor.script);
    expect(vueFile.descriptor.script!.lang).toEqual("ts");
    expect(vueFile.descriptor.scriptSetup).toBeNull();
    expect(vueFile.descriptor.template).toBeDefined();
    expect(vueFile.descriptor.styles).toBeDefined();
    expect(vueFile.descriptor.styles.length).toBe(1);
  });

  it("should throw an error if the file has no script", async () => {
    const path = resolve(__dirname, "./fixtures/MissingScript.vue");
    const content = await readFile(path, { encoding: "utf8" });
    expect(() => readVueFile(content)).rejects.toThrowError("Vue file has no script!");
  });

  it("should throw an error if the file has script setup", async () => {
    const path = resolve(__dirname, "./fixtures/ScriptSetup.vue");
    const content = await readFile(path, { encoding: "utf8" });
    expect(() => readVueFile(content)).rejects.toThrowError("Vue file already has script setup!");
  });
});

describe("test writeFile", () => {
  it("should return a valid vue file", async () => {
    const path = resolve(__dirname, "./fixtures/MinInput.vue");
    const content = await readFile(path, { encoding: "utf8" });
    const { script, vueFile } = await readVueFile(content);
    const scriptContent = '"placeholder";';

    const result = await writeVueFile(vueFile, scriptContent);

    expect(result).toBe(
      `<script setup lang="ts">\n` +
        `${scriptContent}\n` +
        `</script>\n\n` +
        `<template>\n` +
        `  <div class="foo">{{ hello }}</div>\n` +
        `</template>\n\n` +
        `<style lang="scss" scoped>\n` +
        `.foo {\n` +
        `  color: red;\n` +
        `}\n` +
        `</style>`,
    );
  });
});

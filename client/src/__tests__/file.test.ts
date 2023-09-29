import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { readVueFile, writeVueFile } from "../file.js";

const dirname = fileURLToPath(new URL(".", import.meta.url));

vi.mock("node:fs/promises", async () => {
  const actual = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
  return {
    ...actual,
    writeFile: vi.fn(),
  };
});

const mockWriteFile = vi.mocked(writeFile);

describe("test readFile", () => {
  it("test should read a valid vue file", async () => {
    const path = resolve(dirname, "./fixtures/TestInput.vue");

    let { script, vueFile } = await readVueFile(path);

    expect(vueFile.descriptor.script).toBeDefined();
    expect(script).toEqual(vueFile.descriptor.script);
    expect(vueFile.descriptor.script!.lang).toEqual("ts");
    expect(vueFile.descriptor.scriptSetup).toBeNull();
    expect(vueFile.descriptor.template).toBeDefined();
    expect(vueFile.descriptor.styles).toBeDefined();
    expect(vueFile.descriptor.styles.length).toBe(1);
  });

  it("should throw an error if the file has no script", () => {
    const path = resolve(dirname, "./fixtures/MissingScript.vue");
    expect(() => readVueFile(path)).rejects.toThrowError("Vue file has no script!");
  });

  it("should throw an error if the file has script setup", () => {
    const path = resolve(dirname, "./fixtures/ScriptSetup.vue");
    expect(() => readVueFile(path)).rejects.toThrowError("Vue file already has script setup!");
  });
});

describe("test writeFile", () => {
  it("should write a valid vue file", async () => {
    const { script, vueFile } = await readVueFile(resolve(dirname, "./fixtures/MinInput.vue"));
    const scriptContent = '"placeholder";';

    await writeVueFile("output.vue", vueFile, scriptContent);

    expect(mockWriteFile).toHaveBeenCalledWith(
      "output.vue",
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
      { encoding: "utf8" },
    );
  });
});

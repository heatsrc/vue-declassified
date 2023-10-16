import { convertScript, convertSfc } from "@/main";
import { describe, expect, it } from "vitest";

describe("main test", () => {
  it("should convert a Vue SFC file containing Vue Class Component to Script Setup syntax", async () => {
    const sfcString = `
<template><div>{{ foo }}</div></template>
<script lang="ts">
import { Component, Emit } from 'vue-property-decorator';
@Component
export default class Foo {
  foo = 'hello world';
}
</script>
<style lang="scss">
div {
  color: red;
}
</style>
    `;
    const result = await convertSfc(sfcString);

    expect(result).toMatchInlineSnapshot(`
      "<script setup lang=\\"ts\\">
      import { ref } from \\"vue\\";
      const foo = ref(\\"hello world\\");

      </script>

      <template><div>{{ foo }}</div></template>

      <style lang=\\"scss\\">
      div {
        color: red;
      }
      </style>"
    `);
  });

  it("should reject trying to parse an invalid vue file", async () => {
    const sfcString = `
      <template></template><!-- oops unexpected closing tag --></template>
      <script lang="ts">
      import { Component, Emit } from 'vue-property-decorator';
      @Component
      export default class Foo {
        foo = 'hello world';
      }
      </script>
      <style></style>
    `;

    await expect(() => convertSfc(sfcString)).rejects.toThrow("Vue file has errors");
    expect.assertions(1);
  });

  it("should reject is missing script body", async () => {
    const sfcString = `
      <template></template>
      <script lang="ts"></script>
      <style></style>
    `;

    await expect(() => convertSfc(sfcString)).rejects.toThrow("Vue file has no script!");
    expect.assertions(1);
  });

  it("should reject if missing default export", async () => {
    const sfcString = `
      <template></template>
      <script lang="ts">
      import { Component, Emit } from 'vue-property-decorator';
      @Component
      class Foo {
        foo = 'hello world';
      }
      </script>
      <style></style>
    })`;

    await expect(() => convertSfc(sfcString)).rejects.toThrow(
      "No default export found in this file",
    );
    expect.assertions(1);
  });

  it("should reject if already script setup", async () => {
    const sfcString = `
      <template></template>
      <script lang="ts" setup>
      import { Component, Emit } from 'vue-property-decorator';
      @Component
      class Foo {
        foo = 'hello world';
      }
      </script>
      <style></style>
    })`;

    await expect(() => convertSfc(sfcString)).rejects.toThrow("Vue file already has script setup!");
    expect.assertions(1);
  });

  it("should convert convert just a script body", async () => {
    const scriptString = `
import { Component, Emit } from 'vue-property-decorator';
@Component
export default class Foo {
  foo = 'hello world';
}
    `;
    const result = await convertScript(scriptString);

    expect(result).toMatchInlineSnapshot(`
      "import { ref } from \\"vue\\";
      const foo = ref(\\"hello world\\");
      "
    `);
  });
});

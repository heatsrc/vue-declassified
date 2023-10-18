import { convertScript, convertSfc } from "@/main";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
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

  describe("naming collisions", () => {
    it("should warn about naming collisions", async () => {
      const path = resolve(__dirname, "./fixtures/NamingCollisions.vue");
      const content = await readFile(path, { encoding: "utf8" });

      const result = await convertSfc(content);

      expect(result).toMatchInlineSnapshot(`
        "<script setup lang=\\"ts\\">

        /*
        [VUEDC_TODO] Fix naming collisions

          - \`baz\` (TemplateRef) was already defined in: import declarations, class body
          - \`foo\` (Data-ref) was already defined in: import declarations
          - \`qux\` (Method) was already defined in: top level variable declarations
          - \`quux\` (TemplateRef) was already defined in: top level variable declarations
          - \`car\` (Inject) was already defined in: top level variable declarations
          - \`haptic\` (VuexMethod-Action) was already defined in: top level variable declarations

        It is strongly suggested you fix these prior to converting the file.
        Usage of these variables may be ambiguous in the converted code.

        Tips: https://githib.com/heatsrc/vue-declassified#naming-collisions
        */

        import { baz } from \\"./baz\\";
        import foo from \\"./foo\\";
        import { computed, ref, reactive, inject } from \\"vue\\";
        import { useStore } from \\"vuex\\";
        const {
          qux,
          okay: { haptic },
        } = { qux: \\"qux\\" };
        const [quux, { car }] = [\\"quux\\", { car: \\"car\\" }];
        const store = useStore();
        const bar = computed(() => {
          return \\"string\\";
        });
        /* [VUEDC_TODO]: Check for potential naming collisions from '$refs.baz' conversion.*/ const baz =
          ref<HTMLDivElement>();
        const foo = ref(\\"string\\");
        const baz = reactive(baz);
        const qux = () => {
          return 1;
        };
        const quux = ref<HTMLDivElement>();
        const car = inject<string>(\\"vehicle\\");
        const haptic = async (): Promise<void> => store.dispatch(\\"haptic\\");

        </script>

        <template>
          <div>{{ foo }}</div>
        </template>"
      `);
    });
  });

  it('should stop on collisions when "stopOnCollisions" is true', async () => {
    const path = resolve(__dirname, "./fixtures/NamingCollisions.vue");
    const content = await readFile(path, { encoding: "utf8" });

    await expect(() => convertSfc(content, { stopOnCollisions: true })).rejects
      .toThrowErrorMatchingInlineSnapshot(`
      "Fix naming collisions

        - \`baz\` (TemplateRef) was already defined in: import declarations, class body
        - \`foo\` (Data-ref) was already defined in: import declarations
        - \`qux\` (Method) was already defined in: top level variable declarations
        - \`quux\` (TemplateRef) was already defined in: top level variable declarations
        - \`car\` (Inject) was already defined in: top level variable declarations
        - \`haptic\` (VuexMethod-Action) was already defined in: top level variable declarations

      It is strongly suggested you fix these prior to converting the file.
      Usage of these variables may be ambiguous in the converted code.

      Tips: https://githib.com/heatsrc/vue-declassified#naming-collisions"
    `);
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

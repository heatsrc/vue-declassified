import { convertDefaultClassComponent } from "@/convert";
import { readVueFile } from "@/file";
import { getSingleFileProgram } from "@/parser";
import { setImportNameOverride } from "@/registry";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("mixins test", () => {
  it("should transform mixins ", async () => {
    const file = await readFile(resolve(__dirname, "./fixtures/MyComponent.vue"), "utf-8");
    const { script } = await readVueFile(file);
    setImportNameOverride("mixins", "Mixins");
    const { ast, program } = getSingleFileProgram(
      script.content,
      resolve(__dirname, "./fixtures"),
      resolve(__dirname, "./fixtures/tsconfig.json"),
    );
    const result = convertDefaultClassComponent(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import MyOther, { useMyOther } from \\"./MyOther\\";
      import MySpecialMixin, { useMySpecial } from \\"./MySpecialMixin\\";
      import { computed, onMounted, watch } from \\"vue\\";
      /* [VUEDC_TODO]: Check this is correct. */ const { foo, fetchData } = useMySpecial();
      /* [VUEDC_TODO]: Check this is correct. */ const { bar, baz } = useMyOther();
      const myFoo = computed(() => {
          return foo.value;
      });
      const onBarChanged = (newVal: number, oldVal: number) => {
          console.log(\`bar changed \${bar.value} vs \${oldVal}\`);
          fetchData();
      };
      onMounted(() => {
          foo.value = baz === 1 ? 'foo' : 'bar';
      });
      watch(bar, onBarChanged);
      "
    `);
  });
});

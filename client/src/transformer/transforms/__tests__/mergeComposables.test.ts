import { convertAst } from "@/convert";
import { getSingleFileProgram } from "@/parser";
import { describe, expect, it } from "vitest";

describe("mergeComposables test", () => {
  it("should only create one variable for each composable type", () => {
    const { ast, program } = getSingleFileProgram(`
      import { Component, Vue } from 'vue-property-decorator';
      @Component()
      export default class Foo {
        get foo() {
          return this.$store.a + this.$store.b + this.$store.c;
        }

        get route() {
          return this.$route.fullPath;
        }

        get routeIsFoo() {
          return this.$route.name === 'foo';
        }

        goHome() {
          this.$router.push('/');
        }

        goBack() {
          this.$router.back();
        }
      }
    `);
    const result = convertAst(ast, program);

    expect(result).toMatchInlineSnapshot(`
      "import { useStore } from \\"vuex\\";
      import { useRoute, useRouter } from \\"vue-router\\";
      import { computed } from \\"vue\\";
      const store = useStore();
      const route = useRoute();
      const router = useRouter();
      const foo = computed(() => {
          return store.a + store.b + store.c;
      });
      const route = computed(() => {
          return route.fullPath;
      });
      const routeIsFoo = computed(() => {
          return route.name === 'foo';
      });
      const goHome = () => {
          router.push('/');
      };
      const goBack = () => {
          router.back();
      };
      "
    `);
  });
});

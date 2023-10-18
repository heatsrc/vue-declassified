import { resolve } from "path";
import dts from "vite-plugin-dts";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      all: true,
      enabled: true,
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    exclude: [...configDefaults.exclude],
    setupFiles: ["test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@test": resolve(__dirname, "./test"),
    },
  },
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, "./src/main.ts"),
      name: "Vue Declassified",
      fileName: (format) => `main.${format}.js`,
      formats: ["es", "cjs", "umd"],
    },
    rollupOptions: {
      external: [
        "vue",
        "typescript",
        "vue/compiler-sfc",
        "prettier",
        "prettier/parser-typescript",
        "prettier/plugins/estree.js",
      ],
      output: {
        globals: {
          vue: "Vue",
          typescript: "ts",
          prettier: "prettier",
          "vue/compiler-sfc": "vueCompilerSfc",
          "prettier/parser-typescript": "parserTypescript",
          "prettier/plugins/estree.js": "parserEsTree",
        },
      },
    },
  },
  plugins: [dts({ rollupTypes: true })],
});

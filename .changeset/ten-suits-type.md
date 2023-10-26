---
"@heatsrc/vue-declassified": major
---

# Support mixins

When provided a `basePath` in the options `vuedc` will attempt to load the TS project so it can look up instance properties of mixins in the class body and them to a theoretical composable in the same file as the mixin.

Note: loading the project file is significantly slower than a single file program, so it's not currently recommended to use it unless mixins are involved.

BREAKING CHANGES

- `VuedcOptions` now takes a `basePath` for the file being converted rather than `tsConfigPath`. The `tsconfig.json` project file will be deduced from the `basePath`.

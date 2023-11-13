# @heatsrc/vue-declassified

## 3.2.2

### Patch Changes

- [#28](https://github.com/heatsrc/vue-declassified/pull/28) [`e689b10`](https://github.com/heatsrc/vue-declassified/commit/e689b1048f80a353be931f981caf33fc920d69e1) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - Add watch import when trasnformating @Watch

## 3.2.1

### Patch Changes

- [#26](https://github.com/heatsrc/vue-declassified/pull/26) [`0e8d0dd`](https://github.com/heatsrc/vue-declassified/commit/0e8d0dd4c9c412c7191e242e5b7141d30d64d9d0) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - Stip all method modifiers except async from method conversions

## 3.2.0

### Minor Changes

- [#24](https://github.com/heatsrc/vue-declassified/pull/24) [`87b0081`](https://github.com/heatsrc/vue-declassified/commit/87b0081c9e1c57bf8d868dcabc973b6b88d50e79) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - Add support for creating Composable analogues of VCC Mixins found in provided TypeScript file

### Patch Changes

- [#24](https://github.com/heatsrc/vue-declassified/pull/24) [`a94e2fd`](https://github.com/heatsrc/vue-declassified/commit/a94e2fd5bd21141e1b85177e2f5f915458a2563d) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - add docs

## 3.1.3

### Patch Changes

- [`a53e33e`](https://github.com/heatsrc/vue-declassified/commit/a53e33eb241a5966e7b27199bb2b81b286b7367b) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - Fix instances of `this.$refs...` not converting

## 3.1.2

### Patch Changes

- [`d73db3e`](https://github.com/heatsrc/vue-declassified/commit/d73db3efa5d3a1d428ba8c5f57fdf7f7624923f6) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - Fix type check in mixins when project is not defined

- [`3d30743`](https://github.com/heatsrc/vue-declassified/commit/3d30743dc0199909f09215578832e0220c079b88) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - Fix property access expresion as vuex-class decorator params

## 3.1.1

### Patch Changes

- [`c74b54b`](https://github.com/heatsrc/vue-declassified/commit/c74b54be7a6d1c76b93dcf7f50fe0ac34e937cd4) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - Fix emits transform when using object/array literals as payload

## 3.1.0

### Minor Changes

- [#15](https://github.com/heatsrc/vue-declassified/pull/15) [`fc2ed0e`](https://github.com/heatsrc/vue-declassified/commit/fc2ed0e218b3526e9c0a956a90e24427d2d2ce30) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - Add support for vuex-class namespacing of Getter and State decorators

- [#15](https://github.com/heatsrc/vue-declassified/pull/15) [`d1d0a39`](https://github.com/heatsrc/vue-declassified/commit/d1d0a399486b73510d9b1aebecf5c08e6802c9a3) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - Add support for vuex-class namespacing of Action and Mutation decorators

## 3.0.0

### Major Changes

- [#13](https://github.com/heatsrc/vue-declassified/pull/13) [`fba13cc`](https://github.com/heatsrc/vue-declassified/commit/fba13cc61c600ecfd3bf3892b2d7343edca7e75b) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - # Support mixins

  When provided a `basePath` in the options `vuedc` will attempt to load the TS project so it can look up instance properties of mixins in the class body and them to a theoretical composable in the same file as the mixin.

  Note: loading the project file is significantly slower than a single file program, so it's not currently recommended to use it unless mixins are involved.

  BREAKING CHANGES

  - `VuedcOptions` now takes a `basePath` for the file being converted rather than `tsConfigPath`. The `tsconfig.json` project file will be deduced from the `basePath`.

## 2.2.0

### Minor Changes

- [#10](https://github.com/heatsrc/vue-declassified/pull/10) [`9c81095`](https://github.com/heatsrc/vue-declassified/commit/9c8109554f5daa02c6de2180da7500b66cc230ab) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - Add support for supplying a tsconfig profile file.

  Note: By itself this is not super useful but the intention is to make it possible to deduce where properties on the class are being supplied by thinks like mixin or extended components. It may also make it possible to do better type inference.

### Patch Changes

- [#12](https://github.com/heatsrc/vue-declassified/pull/12) [`a547cf6`](https://github.com/heatsrc/vue-declassified/commit/a547cf6cfafc4505c259729463b3e322e3cd804e) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - Reset registry after converting script

## 2.1.2

### Patch Changes

- [`421ed94`](https://github.com/heatsrc/vue-declassified/commit/421ed94faf055b5c446b38a471f522bc8bfcbf41) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - Fixing Github URL in naming collisions warning.

## 2.1.1

### Patch Changes

- [`2a2c0b4`](https://github.com/heatsrc/vue-declassified/commit/2a2c0b43da9ff625d931ca6caa45424bd82113c1) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - documentation and package json updates

## 2.1.0

### Minor Changes

- [#6](https://github.com/heatsrc/vue-declassified/pull/6) [`7e8564f`](https://github.com/heatsrc/vue-declassified/commit/7e8564fb6c9aa776c6e933b1404b31107dfeb5b4) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - Refactoring collision detection, should not introduce breaking changes

## 2.0.0

### Major Changes

- [#4](https://github.com/heatsrc/vue-declassified/pull/4) [`64ac9e3`](https://github.com/heatsrc/vue-declassified/commit/64ac9e3a57e8575d8e0eb0e9a63a91a166235961) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - Reducing vue-declassified bundle size by excluding peer deps

## 1.0.1

### Patch Changes

- [`bb6054f`](https://github.com/heatsrc/vue-declassified/commit/bb6054f7af0a21b2306b399982e38e2466bb9145) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - making packages public

## 1.0.0

### Major Changes

- [`d789401`](https://github.com/heatsrc/vue-declassified/commit/d7894011395bb0f5d6c4bc7da243fe07a40fa055) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - Vue Declassified initial release!

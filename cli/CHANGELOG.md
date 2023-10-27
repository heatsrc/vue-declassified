# @heatsrc/vuedc

## 3.2.2

### Patch Changes

- Updated dependencies [[`c74b54b`](https://github.com/heatsrc/vue-declassified/commit/c74b54be7a6d1c76b93dcf7f50fe0ac34e937cd4)]:
  - @heatsrc/vue-declassified@3.1.1

## 3.2.1

### Patch Changes

- Updated dependencies [[`fc2ed0e`](https://github.com/heatsrc/vue-declassified/commit/fc2ed0e218b3526e9c0a956a90e24427d2d2ce30), [`d1d0a39`](https://github.com/heatsrc/vue-declassified/commit/d1d0a399486b73510d9b1aebecf5c08e6802c9a3)]:
  - @heatsrc/vue-declassified@3.1.0

## 3.2.0

### Minor Changes

- [#13](https://github.com/heatsrc/vue-declassified/pull/13) [`d7dd6d0`](https://github.com/heatsrc/vue-declassified/commit/d7dd6d06124b2a73fd9908aa59139f76ee872a25) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - Remove tsConfig filepath from project flag

  vue-declassified now infers the tsconfig from the sfc file path

### Patch Changes

- Updated dependencies [[`fba13cc`](https://github.com/heatsrc/vue-declassified/commit/fba13cc61c600ecfd3bf3892b2d7343edca7e75b)]:
  - @heatsrc/vue-declassified@3.0.0

## 3.1.0

### Minor Changes

- [#10](https://github.com/heatsrc/vue-declassified/pull/10) [`9c81095`](https://github.com/heatsrc/vue-declassified/commit/9c8109554f5daa02c6de2180da7500b66cc230ab) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - Add support for supplying a tsconfig profile file.

  Note: By itself this is not super useful but the intention is to make it possible to deduce where properties on the class are being supplied by thinks like mixin or extended components. It may also make it possible to do better type inference.

### Patch Changes

- Updated dependencies [[`9c81095`](https://github.com/heatsrc/vue-declassified/commit/9c8109554f5daa02c6de2180da7500b66cc230ab), [`a547cf6`](https://github.com/heatsrc/vue-declassified/commit/a547cf6cfafc4505c259729463b3e322e3cd804e)]:
  - @heatsrc/vue-declassified@2.2.0

## 3.0.2

### Patch Changes

- Updated dependencies [[`421ed94`](https://github.com/heatsrc/vue-declassified/commit/421ed94faf055b5c446b38a471f522bc8bfcbf41)]:
  - @heatsrc/vue-declassified@2.1.2

## 3.0.1

### Patch Changes

- [`2a2c0b4`](https://github.com/heatsrc/vue-declassified/commit/2a2c0b43da9ff625d931ca6caa45424bd82113c1) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - documentation and package json updates

- Updated dependencies [[`2a2c0b4`](https://github.com/heatsrc/vue-declassified/commit/2a2c0b43da9ff625d931ca6caa45424bd82113c1)]:
  - @heatsrc/vue-declassified@2.1.1

## 3.0.0

### Major Changes

- [#6](https://github.com/heatsrc/vue-declassified/pull/6) [`659b0e6`](https://github.com/heatsrc/vue-declassified/commit/659b0e617af28bd75efebded1115e993c87987ad) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - Add flag to ignore collisions when detected and continue writing output

  BREAKING CHANGE:

  - The cli will now not write the output Vue file when collisions have been detected, instead it will output and error to the console
  - The `--ignore-collisions` flag will behave as in previous versions where the warning is just printed in the script tag of the output Vue file.

### Patch Changes

- Updated dependencies [[`7e8564f`](https://github.com/heatsrc/vue-declassified/commit/7e8564fb6c9aa776c6e933b1404b31107dfeb5b4)]:
  - @heatsrc/vue-declassified@2.1.0

## 2.0.0

### Major Changes

- [#4](https://github.com/heatsrc/vue-declassified/pull/4) [`64ac9e3`](https://github.com/heatsrc/vue-declassified/commit/64ac9e3a57e8575d8e0eb0e9a63a91a166235961) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - Reducing vue-declassified bundle size by excluding peer deps

### Patch Changes

- Updated dependencies [[`64ac9e3`](https://github.com/heatsrc/vue-declassified/commit/64ac9e3a57e8575d8e0eb0e9a63a91a166235961)]:
  - @heatsrc/vue-declassified@2.0.0

## 1.0.1

### Patch Changes

- [`bb6054f`](https://github.com/heatsrc/vue-declassified/commit/bb6054f7af0a21b2306b399982e38e2466bb9145) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - making packages public

- Updated dependencies [[`bb6054f`](https://github.com/heatsrc/vue-declassified/commit/bb6054f7af0a21b2306b399982e38e2466bb9145)]:
  - @heatsrc/vue-declassified@1.0.1

## 1.0.0

### Major Changes

- [`d789401`](https://github.com/heatsrc/vue-declassified/commit/d7894011395bb0f5d6c4bc7da243fe07a40fa055) Thanks [@jaredmcateer](https://github.com/jaredmcateer)! - Vue Declassified initial release!

### Patch Changes

- Updated dependencies [[`d789401`](https://github.com/heatsrc/vue-declassified/commit/d7894011395bb0f5d6c4bc7da243fe07a40fa055)]:
  - @heatsrc/vue-declassified@1.0.0

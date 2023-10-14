# Vue Declassified CLI tool

This CLI tool converted Vue 2/3 Class Components, i.e., [vue-class-component](https://class-component.vuejs.org/), into Vue 3 Script Setup using Vue Declassified ([github](https://github.com/heatsrc/vue-declassified)) ([npm](https://npmjs.com/@heatsrc/vue-declassified)). VueDc supports the Vue Class Component v8 RC which was originally being developed to support Vue 3 but subsequently abandoned before release.

## Install

Installing is optional as the mainstream package managers have the ability to [hot load packages](#hot-loading).

```console
pnpm add -g @heatsrc/vuedc
```

```console
npm install -g @heatsrc/vuedc
```

```console
yarn global add @heatsrc/vuedc
```

## Usage

```bash
vuedc -i MyComponent.vue -o MyOutput.vue
```

```bash
$ vuedc -h

Usage: vuedc [options]

Convert Vue Class Components to Vue 3 Composition API

Options:
  -V, --version        output the version number
  -i, --input <file>   Input Vue file
  -o, --output <file>  Output file, if not specified input file will be overwritten
  -y, --yes            Overwrite output file without asking
  -h, --help           display help for command
```

### Hot loading

```bash
pnpm dlx vuedc -i MyComponent.vue -o MyOutput.vue
```

```bash
npx vuedc -i MyComponent.vue -o MyOutput.vue
```

```bash
yarn dlx vuedc -i MyComponent.vue -o MyOutput.vue
```

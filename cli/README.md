# Vue Declassified CLI tool

This CLI tool converted Vue 2/3 Class Components, i.e., [vue-class-component](https://class-component.vuejs.org/), into Vue 3 Script Setup using [Vue Declassified](https://github.com/heatsrc/vue-declassified) ([npm](https://npmjs.com/@heatsrc/vue-declassified)). VueDc supports both Vue Class Component production (`@Component`) and the v8 RC (`@Options`) which was originally being developed to support Vue 3 but subsequently abandoned before release.

## Install

Installing is optional as the mainstream package managers have the ability to [hot load packages](#hot-loading).

```bash
pnpm add -g @heatsrc/vuedc
# or
npm install -g @heatsrc/vuedc
# or
yarn global add @heatsrc/vuedc
```

**NOTE:** You will need Node 18+ for VueDc to work. Consider using a node version manager, e.g., [nvm](https://github.com/nvm-sh/nvm), to make switching easy if your project is locked to an older version.

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
  --ignore-collisions  Will not stop on collisions
  -i, --input <file>   Input Vue file
  -o, --output <file>  Output file, if not specified input file will be overwritten
  -y, --yes            Overwrite output file without asking
  -h, --help           display help for command
```

### Hot loading

```bash
pnpm dlx vuedc -i MyComponent.vue -o MyOutput.vue
# or
npx vuedc -i MyComponent.vue -o MyOutput.vue
# or
yarn dlx vuedc -i MyComponent.vue -o MyOutput.vue
```

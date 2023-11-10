# Vue Declassified CLI tool

<p align="center">
  <a href="https://www.npmjs.com/package/@heatsrc/vuedc">npm</a><span> | </span>
  <a href="https://github.com/heatsrc/vue-declassified/tree/main/cli">github</a><span> | </span>
  <a href="https://heatsrc.github.io/vue-declassified/">vuedc playground</a>
</p>

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

### Converting a Vue Class Component to Script API

```bash
vuedc -i MyComponent.vue -o MyOutput.vue
```

When provided a Vue file Vuedc will convert a Vue Class Component to Script API and update the script body. Current Vuedc does not make changes in the template but does best effort to name variables the same as they were in the class to avoid needing to update. There are a few cases where this may fail, mainly when using `$ref`s with the same name as properties or accessors on the class, Vuedc will attempt to warn in the results.

### Making Composable functions out of Vue Class Component Mixins

```bash
vuedc -i MyMixin.ts -y
```

When provided a `.ts` file Vuedc will make composable function analogues of any Vue Class Component Mixins found in the file and append them to the file.

_Note_: Vuedc also leaves the Mixin in place as it is not certain the mixin may be used by other class based components.

### `@heatsrc/vuedc --help`

```bash
$ vuedc -h

Usage: vuedc [options]

Convert Vue Class Components to Vue 3 Composition API

Options:
  -V, --version        output the version number
  --ignore-collisions  Will not stop on collisions
  -p, --project        Use compiler options from tsconfig.json file, vuedc will attempt to derive the `tsconfig.json` from the input file.
                       WARNING: this option is significantly slower than not using it, only enable if you need external references (e.g., deriving sources of properties from mixins)!
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

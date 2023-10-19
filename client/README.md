<h1 align="center">
  <div aria-hidden align="center">
    <img src="https://github.com/heatsrc/vue-declassified/blob/main/client/assets/vuedc-logo-200.png" aria-hidden />
  </div>
  <span>Vue Declassified (vuedc)</span>
</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@heatsrc/vue-declassified">npm</a><span> | </span>
  <a href="https://github.com/heatsrc/vue-declassified">github</a><span> | </span>
  <a href="https://heatsrc.github.io/vue-declassified/">vuedc playground</a>
</p>

- [Vue Class Components -\> Vue 3 script setup](#vue-class-components---vue-3-script-setup)
  - [Opinionated decisions](#opinionated-decisions)
- [Usage](#usage)
  - [vuedc CLI (recommended)](#vuedc-cli-recommended)
  - [Programmatically](#programmatically)
    - [Install](#install)
      - [Dependencies](#dependencies)
    - [Code](#code)
- [Supported Features](#supported-features)
  - [vue-class-component](#vue-class-component)
    - [`@Component` / `@Options` (v8.0.0-rc.1)](#component--options-v800-rc1)
  - [vue-property-decorator](#vue-property-decorator)
  - [vuex-class](#vuex-class)
  - [Misc features](#misc-features)
- [Tips / Gotchas](#tips--gotchas)
  - [Directives / Component names](#directives--component-names)
  - [Naming collisions](#naming-collisions)
    - [`$refs` with same name as class members](#refs-with-same-name-as-class-members)
    - [Top level identifiers](#top-level-identifiers)

## Vue Class Components -> Vue 3 script setup

Vue Declassified is an opinionated tool that will format Vue class components (including the v8 RC package) to script setup. This project a fork and re-write of yoyo930021's [vc2c](https://github.com/yoyo930021/vc2c) which is focused more on Vue 2 -> Composition API using `defineComponent`.

### Opinionated decisions

These decisions are made arbitrarily, mostly for sanity and convenience. You get what you get and you don't get upset.

- No/Limited configuration
  - There is a lot of different edge cases to test and adding configuration options tends to act as a multiplier for those cases.
- Will only support TS
- Won't support esoteric/redundant `@Component`/`@Options` options
  - Will consider accepting PRs
- Will order files `script` -> `template` -> `style`
- Will reference macros by arbitrary variables (see below)
- Will be formatted by prettier with default config
  - exception `printWidth` increased to 100 characters

## Usage

### vuedc CLI (recommended)

You can call the CLI tool to convert a file directly from a terminal. For more information see the [vuedc](https://github.com/heatsrc/vue-declassified/blob/main/cli/README.md) readme.

```console
pnpm add -g @heatsrc/vuedc
# or
npm install -g @heatsrc/vuedc
# or
yarn add -g @heatsrc/vuedc

vuedc -i myVueComponent.vue -o myVueComponent.converted.vue
```

or run directly with hot loading

```console
pnpm dlx vuedc -i myVueComponent.vue -o myVueComponent.converted.vue
# or
npx vuedc -i myVueComponent.vue -o myVueComponent.converted.vue
# or
yarn dlx vuedc -i myVueComponent.vue -o myVueComponent.converted.vue
```

### Programmatically

#### Install

##### Dependencies

If you want to use this without the cli tool you'll need to ensure you have the following packages installed

- typescript@^5.2.2
- vue@^3.3.4
- prettier@^3.0.3

Additionally vue-declassified requires Node 18+

```console
pnpm add @heatsrc/vue-declassified
# or
npm install @heatsrc/vue-declassified
# or
yarn install @heatsrc/vue-declassified
```

#### Code

```ts
import { convertSfc } from "@heatsrc/vue-declassified";
import {readFile, writeFile} from 'node:fs/promises';

const input = "./myVueComponent.vue";
const output = "./myVueComponent.converted.vue";

(async () => {
  const encoding = {encoding: 'utf8'};
  const inputFile = await readFile(input, encoding);

  const result = await convertSfc(input, output);

  await writeFile(output, encoding);
}());
```

```ts
import { convertScript } from "@heatsrc/vue-declassified";

const input = `
import { Component } from 'vue-class-component';
@Component()
export default class MyComponent extends Vue {
  myData: string = 'foo';
}`;

const result = convertScript(input);

console.log(result);
// import { ref } from 'vue';
// const myData = ref<string>('foo');
```

## Supported Features

|       Legend       |                                                                   |
| :----------------: | ----------------------------------------------------------------- |
| :white_check_mark: | Currently supported                                               |
| :heavy_check_mark: | Not currently being supported but being worked on                 |
|       :zzz:        | Support is not prioritized                                        |
|       :boom:       | No transform path to script setup (breaking change in Vue 2 -> 3) |
|      :rocket:      | All planned features are supported in section, let go!            |

### vue-class-component

<details>
<summary>Basic class transforms (5 :white_check_mark: / 2 :heavy_check_mark:)</summary>

|      feature       |     supported?     | notes                                  |
| :----------------: | :----------------: | -------------------------------------- |
|      methods       | :white_check_mark: | Basic method support (no decorators)   |
|  data properties   | :white_check_mark: | Basic class properties (no decorators) |
|  getters/setters   | :white_check_mark: | Computed refs                          |
|       mixins       | :heavy_check_mark: |                                        |
|       extend       | :heavy_check_mark: |                                        |
| sort by dependency | :white_check_mark: | Will try to sort dependencies\*        |
|  `$refs:! {...}`   | :white_check_mark: | converted to regular `Ref`s            |

<sup>\* VueDc does it best to sort dependencies to avoid used before defined issues. It requires processing essentially a directed acyclic graph and it's complicated so please raise issues if found.</sup>

</details>

<details>
<summary>Lifecycle Hooks (11/11 :rocket:)</summary>

| lifecycle hooks |     supported?     | notes                                            |
| :-------------: | :----------------: | ------------------------------------------------ |
|  beforeCreate   | :white_check_mark: | body contents moved to root of script setup body |
|     created     | :white_check_mark: | body contents moved to root of script setup body |
|   beforeMount   | :white_check_mark: | `onBeforeMount`                                  |
|     mounted     | :white_check_mark: | `onMounted`                                      |
|  beforeUpdate   | :white_check_mark: | `onBeforeUpdate`                                 |
|     updated     | :white_check_mark: | `onUpdated`                                      |
|    activated    | :white_check_mark: | `onActivated`                                    |
|   deactivated   | :white_check_mark: | `onDeactivated`                                  |
|  beforeDestroy  | :white_check_mark: | `onBeforeDestroy`                                |
|    destroyed    | :white_check_mark: | `onDestroy`                                      |
|  errorCaptured  | :white_check_mark: | `onErrorCaptured`                                |

</details>

<details>
<summary><code>this.<property></code> (11 :white_check_mark: / 3 :heavy_check_mark: / 5 :boom:)</summary>

|    `this.`     |     supported?     | notes                                                                    |
| :------------: | :----------------: | ------------------------------------------------------------------------ |
| PropertyAccess | :white_check_mark: | Primitives: `Ref`, Complex: `Reactive`, Uninitialized: Regular variables |
|    methods     | :white_check_mark: |                                                                          |
|    `$attrs`    | :heavy_check_mark: | Via `const attrs = useAttrs()`                                           |
|    `$data`     | :white_check_mark: | Treated same as data Class PropertyAssignments                           |
|    `$emit`     | :white_check_mark: | Via `const emit = defineEmits<...>()`                                    |
|  `$nextTick`   | :white_check_mark: | Via `import { nextTick } from 'vue';`                                    |
|   `$parent`    |       :boom:       | Refactor your code. Prop/Emits or Provide/Inject<sup>\*</sup>            |
|  `$children`   |       :boom:       | -                                                                        |
|    `$props`    | :white_check_mark: | Via `const props = defineProps<...>()`                                   |
|    `$refs`     | :white_check_mark: |                                                                          |
|    `$route`    | :white_check_mark: | Via `const route = useRoute();`                                          |
|   `$router`    | :white_check_mark: | Via `const router = useRouter();`                                        |
|    `$slots`    | :heavy_check_mark: | Via `const slots = defineSlots<...>()`                                   |
| `$scopedSlots` | :heavy_check_mark: | Via `const slots = defineSlots<...>()`                                   |
|    `$store`    | :white_check_mark: | Via `const store = useStore();`                                          |
|    `$watch`    | :white_check_mark: | Via `import { watch } from 'vue';`                                       |
|     `$on`      |       :boom:       |                                                                          |
|    `$once`     |       :boom:       |                                                                          |
|     `$off`     |       :boom:       |                                                                          |

<sup>\* <a href="https://stackoverflow.com/questions/50942544/emit-event-from-content-in-slot-to-parent">Strategies to handle tightly coupled children in slots</a></sup>

</details>

#### `@Component` / `@Options` (v8.0.0-rc.1)

These are options provided in the decorator call, e.g., `@Component({ components: { MyIcon } })`. All Options API fields are _technically_ supported in Vue Class Components (e.g., data, computed, methods, etc) but many of them don't make sense and will not be actively developed but PRs may be accepted.

<details>
<summary>Options-Data (4/4 :rocket:)</summary>

| Options-Data |     supported?     | notes                                                            |
| :----------: | :----------------: | ---------------------------------------------------------------- |
|     data     |       :zzz:        | While you can add these what you even using VCC for?             |
|    props     | :white_check_mark: |                                                                  |
|  propsData   |       :zzz:        | This is primarily a testing feature                              |
|   computed   |       :zzz:        | While you can add these what you even using VCC for?             |
|    watch     | :white_check_mark: |                                                                  |
|   exposes    | :white_check_mark: | RC Feature since Vue 3 require declaring exposed fields          |
|    emits     | :white_check_mark: | RC Feature since Vue 3 require declaring events that are emitted |

</details>

<details>
<summary>Options-Assets (2 :heavy_check_mark: / 1 :zzz:)</summary>

| Options-Assets |     supported?     | notes                                                                                             |
| :------------: | :----------------: | ------------------------------------------------------------------------------------------------- |
|   directives   | :heavy_check_mark: | Will attempt to rename directives if they don't match                                             |
|    filters     | :heavy_check_mark: | Will be converted to simple methods, you'll need to fix pipe style filters in your html templates |
|   components   |       :zzz:        | If you chance the name of your imports this may break                                             |

</details>

<details>
<summary>Options-Composition (1 :heavy_check_mark: / 3 :zzz:)</summary>

| Options-Composition |     supported?     | notes                                                    |
| :-----------------: | :----------------: | -------------------------------------------------------- |
|       parent        |       :zzz:        | Seem hacky to be specifying a parent in VCC SFC          |
|       mixins        |       :zzz:        | While you can add these what are you even using VCC for? |
|       extends       |       :zzz:        | -                                                        |
|   provide/inject    | :heavy_check_mark: |                                                          |

</details>

<details>
<summary>Options-Misc (2 :heavy_check_mark: / 4 :zzz:)</summary>

| Options-Misc |     supported?     | notes                                                                 |
| :----------: | :----------------: | --------------------------------------------------------------------- |
|     name     |       :zzz:        | Doesn't make much sense an script setup                               |
|  delimiters  |       :zzz:        |                                                                       |
|  functional  |       :zzz:        | If all it uses is props script setup will automatically be functional |
|    model     | :heavy_check_mark: |                                                                       |
| inheritAttrs | :heavy_check_mark: |                                                                       |
|   comments   |       :zzz:        | VueDc will try to preserve comments by default                        |

</details>

<details>
<summary>Options-DOM (4/4 :zzz:)</summary>

| Options-DOM | supported? | notes                                       |
| :---------: | :--------: | ------------------------------------------- |
|     el      |   :zzz:    | DOM Options are more suited for Options API |
|  template   |   :zzz:    | -                                           |
|   render    |   :zzz:    | -                                           |
| renderError |   :zzz:    | -                                           |

</details>

<details>
<summary>Options-LifeCycleHooks (11/11 :zzz:)</summary>

| Options-LifeCycle Hooks | supported? | notes                                                |
| :---------------------: | :--------: | ---------------------------------------------------- |
|      beforeCreate       |   :zzz:    | While you can add these what you even using VCC for? |
|         created         |   :zzz:    | -                                                    |
|       beforeMount       |   :zzz:    | -                                                    |
|         mounted         |   :zzz:    | -                                                    |
|      beforeUpdate       |   :zzz:    | -                                                    |
|         updated         |   :zzz:    | -                                                    |
|        activated        |   :zzz:    | -                                                    |
|       deactivated       |   :zzz:    | -                                                    |
|      beforeDestroy      |   :zzz:    | -                                                    |
|        destroyed        |   :zzz:    | -                                                    |
|      errorCaptured      |   :zzz:    | -                                                    |

</details>

### vue-property-decorator

<details>
<summary><code>Decorators</code> (6 :white_check_mark: 1 :heavy_check_mark: / 3 :zzz:)</summary>

|     decorator      |     supported?     | notes                                                                                        |
| :----------------: | :----------------: | -------------------------------------------------------------------------------------------- |
|      `@Prop`       | :white_check_mark: |                                                                                              |
|    `@PropSync`     |       :zzz:        |                                                                                              |
|      `@Model`      | :heavy_check_mark: |                                                                                              |
|      `@Watch`      | :white_check_mark: |                                                                                              |
|     `@Provide`     | :white_check_mark: |                                                                                              |
|     `@Inject`      | :white_check_mark: |                                                                                              |
| `@ProvideReactive` |       :zzz:        |                                                                                              |
| `@InjectReactive`  |       :zzz:        |                                                                                              |
|      `@Emit`       | :white_check_mark: |                                                                                              |
|       `@Ref`       | :white_check_mark: | Currently parsing templates isn't in the works so ref aliases will require updating if used. |

</details>

### vuex-class

<details>
<summary><code>Decorators</code> (4 :white_check_mark:, 1 :heavy_check_mark:)</summary>

|  decorator  |     supported?     | notes |
| :---------: | :----------------: | ----- |
|  `@Action`  | :white_check_mark: |       |
|  `@Getter`  | :white_check_mark: |       |
| `@Mutation` | :white_check_mark: |       |
|  `@State`   | :white_check_mark: |       |
|  namespace  | :heavy_check_mark: |       |

</details>

### Misc features

<details>
<summary>Other features (6/6 :rocket:)</summary>

- :white_check_mark: **Limited type inference**
  - If a node is untyped, will do a best guess at type (mostly primitive types only).
  - When encountering `$emit`s will try to infer parameter names/types.
  - Fails back to `unknown` keyword if it's not certain.
- :white_check_mark: **Sorting by dependencies**
  - Will sort statements so definitions occur before uses.
- :white_check_mark: **Merging macros/props/etc**
  - If you're code is doing insane stuff like defining props in both the `@Component` options and as decorators, `@Props`/`@Emit`/ etc, vuedc will merge the definitions.
- :white_check_mark: **Naming collision detection**
  - Will detect collisions from imports, variable declarations and instance properties that have been converted to top level (e.g., `$ref.button` => `button.value`).
- :white_check_mark: **Automatic macro definitions**
  - Props -> `defineProps` (also will add `withDefaults` if vuedc detects defaults).
  - Emit -> `defineEmits`.
- :white_check_mark: **Composable definitions**
  - When former "builtin" globals such as `$store`/`$router`/etc are found vuedc will automatically import and assign to a variable
  - e.g., `const store = useStore()`

</details>

## Tips / Gotchas

### Directives / Component names

Vue expects directive and components to match their name (`PascalCase`/`camelCase` -> `kebab-case`).
Currently Vuedc doesn't detect if you've used a different name and aliased it in the component options

```vue
<script lang="ts">
import {Component, Vue} from 'vue-class-components';
import myComponentVue from './MyComponent.vue';
import myDirective from './MyDirective.ts';

@Component({
  components: { MyComponent: myComponentVue },
  directives: { vMyDirective: myDirective }
})
export default Foo extends Vue {}
</script>

// will be converted to:

<script setup lang="ts">
import myComponentVue from "./MyComponent.vue";
import myDirective from "./MyDirective.ts";
</script>

<template>
  <!-- This is a problem ! -->
  <my-component v-my-directive />
</template>
```

So make sure to rename your imports to match what the template is calling.

e.g.,

```vue
<script setup lang="ts">
import MyComponent from "./MyComponent.vue";
import vMyDirective from "./vMyDirective.ts";
</script>

<template>
  <my-component v-my-directive />
</template>
```

### Naming collisions

It's strongly recommended you resolve potential naming collisions prior to converting your code, vuedc doesn't have complete knowledge of the codes intention and doesn't update templates (yet?) so it can't reliably rename variables for you.

Common reasons for naming collisions:

#### `$refs` with same name as class members

Properties on the `$refs` object get converted to top level variable declarations and can collide with other class members sharing the same name.

e.g.,

```ts
@Component
export default class Foo extends Vue {
  foo = "bar";

  $refs!: {
    foo: HTMLDivElement;
  };
}

// will be converted to

const foo = ref<string>("bar");
const foo = ref<HTMLDivElement>();
//    ^? Cannot redeclare block-scoped variable 'foo'.ts(2451)
```

#### Top level identifiers

It's not uncommon for you to import a variable from another module and make it available as a class member with the same name.

e.g.,

```ts
import foo from './foo';
const bar = foo;
const { a, b: { c } } = {a: true, b: { c: false } };
const [d, e, {f}] = [1, 2, {f: 3}];

@Component
export default Foo {
  foo = 'string';
  a = 1;
  b = 'b';
  d = [1, 2, 3];
  @Inject e: () => 'e';
  @Action f: () => Promise<void>;


  get bar() {
  }

  c() {
  }
}

// will be converted to

import foo from './foo';
const bar = foo;
const { a, b: { c } } = {a: true, b: { c: false } };
const [d, e, {f}] = [1, 2, {f: 3}];
const foo = ref('string');
//    ^? Cannot redeclare block-scoped variable 'foo'.ts(2451)
const a = ref(1);
//    ^? Cannot redeclare block-scoped variable 'a'.ts(2451)
const b = ref('b');
//    ^? Cannot redeclare block-scoped variable 'b'.ts(2451)
const d = reactive([1, 2, 3]);
//    ^? Cannot redeclare block-scoped variable 'd'.ts(2451)
const e = inject<() => 'e'>('e');
//    ^? Cannot redeclare block-scoped variable 'e'.ts(2451)
const f = (): Promise<void> => store.dispatch('f');
//    ^? Cannot redeclare block-scoped variable 'f'.ts(2451)
const bar = computed(() => 'val');
//    ^? Cannot redeclare block-scoped variable 'bar'.ts(2451)
const c = () => 'foo';
//    ^? Cannot redeclare block-scoped variable 'c'.ts(2451)
```

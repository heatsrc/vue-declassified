# Vue DeClassified (VueDc)

## Convert Vue Class Components to Vue 3 script setup

VueDc is an opinionated tool that will format Vue class components to script setup. This project a fork and re-write of yoyo930021's [vc2c](https://github.com/yoyo930021/vc2c)

### Opinionated decisions These decisions are made arbitrarily, mostly for sanity and convenience.

- Will only support TS
- Won't support esoteric `@Component` options
  - Will consider accepting PRs
- Will order files `script` -> `template` -> `style`
- Will reference macros by arbitrary variables (see below)
- Will be formatted by prettier with default config
  - exception `printWidth` increased to 100 characters
- Will attempt to preserve untransformed code
  - Won't guarantee correctness though
  - Will try to flag with comments

### Supported Features

|       Legend       |                                                                   |
| :----------------: | ----------------------------------------------------------------- |
| :white_check_mark: | Currently supported                                               |
| :heavy_check_mark: | Not currently being supported but being worked on                 |
|       :zzz:        | Support is not prioritized                                        |
|       :boom:       | No transform path to script setup (breaking change in Vue 2 -> 3) |
|      (#/#/#)       | Supported / Will Support / Skipped                                |

### vue-class-component

#### `@Component` / `@Options` (v8.0.0-rc.1)

These are options provided in the decorator call, e.g., `@Component({ components: { MyIcon } })`. All Options API fields are _technically_ supported in Vue Class Components (e.g., data, computed, methods, etc) but many of them don't make sense and will not be actively developed but PRs may be accepted.

<details>
<summary>Options-Data (4 :heavy_check_mark: / 3 :zzz:)</summary>

| Options-Data |     supported?     | notes                                                   |
| :----------: | :----------------: | ------------------------------------------------------- |
|     data     |       :zzz:        | While you can add these what you even using VCC for?    |
|    props     | :heavy_check_mark: |                                                         |
|  propsData   |       :zzz:        | This is primarily a testing feature                     |
|   computed   |       :zzz:        | While you can add these what you even using VCC for?    |
|    watch     | :heavy_check_mark: |                                                         |
|    emits     | :heavy_check_mark: | RC Feature since Vue 3 requires declaring emits         |
|   exposes    | :heavy_check_mark: | RC Feature since Vue 3 require declaring exposed fields |

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

<details>
<summary>Options-Assets (2 :heavy_check_mark: / 1 :zzz:)</summary>

| Options-Assets |     supported?     | notes                                                 |
| :------------: | :----------------: | ----------------------------------------------------- |
|   directives   | :heavy_check_mark: |                                                       |
|    filters     | :heavy_check_mark: | Will be converted to simple methods                   |
|   components   |       :zzz:        | If you chance the name of your imports this may break |

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

#### Class

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
<summary>Lifecycle Hooks (11/11 :white_check_mark:) :rocket:</summary>

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
<summary>`this.<property>` (3 :white_check_mark: / 11 :heavy_check_mark: / 5 :boom:)</summary>

|    `this.`     |     supported?     | notes                                                                    |
| :------------: | :----------------: | ------------------------------------------------------------------------ |
| PropertyAccess | :white_check_mark: | Primitives: `Ref`, Complex: `Reactive`, Uninitialized: Regular variables |
|    methods     | :white_check_mark: |                                                                          |
|    `$attrs`    | :heavy_check_mark: | Via `const attrs = useAttrs()`                                           |
|    `$data`     | :heavy_check_mark: | Treated same as data Class PropertyAssignments                           |
|    `$emit`     | :heavy_check_mark: | Via `const emit = defineEmits<...>()`                                    |
|  `$nextTick`   | :heavy_check_mark: | Via `import { nextTick } from 'vue';`                                    |
|   `$parent`    |       :boom:       | Refactor your code. Prop/Emits or Provide/Inject<sup>\*</sup>            |
|  `$children`   |       :boom:       | -                                                                        |
|    `$props`    | :heavy_check_mark: | Via `const props = defineProps<...>()`                                   |
|    `$refs`     | :white_check_mark: |                                                                          |
|    `$route`    | :heavy_check_mark: | Via `const route = useRoute();`                                          |
|   `$router`    | :heavy_check_mark: | Via `const router = useRouter();`                                        |
|    `$slots`    | :heavy_check_mark: | Via `const slots = defineSlots<...>()`                                   |
| `$scopedSlots` | :heavy_check_mark: | Via `const slots = defineSlots<...>()`                                   |
|    `$store`    | :heavy_check_mark: | Via `const store = useStore();`                                          |
|    `$watch`    | :heavy_check_mark: | Via `import { watch } from 'vue';`                                       |
|     `$on`      |       :boom:       |                                                                          |
|    `$once`     |       :boom:       |                                                                          |
|     `$off`     |       :boom:       |                                                                          |

<sup>\* <a href="https://stackoverflow.com/questions/50942544/emit-event-from-content-in-slot-to-parent">Strategies to handle tightly coupled children in slots</a></sup>

</details>

### vue-property-decorator

<details>
<summary>`Decorators` (9 :heavy_check_mark: / 1 :zzz:)</summary>

|     decorator      |     supported?     | notes |
| :----------------: | :----------------: | ----- |
|      `@Prop`       | :heavy_check_mark: |       |
|    `@PropSync`     |       :zzz:        |       |
|      `@Model`      | :heavy_check_mark: |       |
|      `@Watch`      | :heavy_check_mark: |       |
|     `@Provide`     | :heavy_check_mark: |       |
|     `@Inject`      | :heavy_check_mark: |       |
| `@ProvideReactive` | :heavy_check_mark: |       |
| `@InjectReactive`  | :heavy_check_mark: |       |
|      `@Emit`       | :heavy_check_mark: |       |
|       `@Ref`       | :heavy_check_mark: |       |

</details>

### vuex-class

<details>
<summary>`Decorators` (8/8 :heavy_check_mark:)</summary>

|   decorator    |     supported?     | notes |
| :------------: | :----------------: | ----- |
|   `@Action`    | :heavy_check_mark: |       |
|   `@Getter`    | :heavy_check_mark: |       |
|  `@Mutation`   | :heavy_check_mark: |       |
|    `@State`    | :heavy_check_mark: |       |
|  `@Ns.Action`  | :heavy_check_mark: |       |
|  `@Ns.Getter`  | :heavy_check_mark: |       |
| `@Ns.Mutation` | :heavy_check_mark: |       |
|  `@Ns.State`   | :heavy_check_mark: |       |

</details>

# Vexus

## Convert Vue Class Components to Vue 3 script setup

Vexus is an opinionated tool that will format Vue class components to script setup. Vexus is heavily influence by the great work of yoyo930021: https://github.com/yoyo930021/vc2c

### Opinionated decisions

These decisions are made arbitrarily, mostly for sanity and convenience.

- Will only support TS
- Won't support esoteric `@Component` options
  - Will consider accepting PRs
- Will order files `script` -> `template` -> `style`
- Will be formatted by prettier with default config
  - exception `printWidth` increased to 100 characters
- Will attempt to preserve untransformed code
  - Won't guarantee correctness though
  - Will try to flag with comments

### Supported Features

### vue-class-component

:zzz: - denotes support is not prioritized, either because these would be rarely used as there is a class component analogue, or it doesn't make sense in script setup

- `@Options` / `@Component`
  - Data
    - [ ] data :zzz:
    - [ ] props
    - [ ] propsData :zzz:
    - [ ] computed :zzz:
    - [ ] methods :zzz:
    - [ ] watch
  - DOM :zzz:
    - [ ] el
    - [ ] template
    - [ ] render
    - [ ] renderError
  - Lifecycle hooks :zzz:
    - [ ] beforeCreate
    - [ ] created
    - [ ] beforeMount
    - [ ] mounted
    - [ ] beforeUpdate
    - [ ] updated
    - [ ] activated
    - [ ] deactivated
    - [ ] beforeDestroy
    - [ ] destroyed
    - [ ] errorCaptured
  - Assets
    - [ ] directives
    - [ ] filters
    - [ ] components :zzz:
  - Composition
    - [ ] parent :zzz:
    - [ ] mixins :zzz:
    - [ ] extends :zzz:
    - [ ] provide / inject
  - Misc
    - [ ] name :zzz:
    - [ ] delimiters :zzz:
    - [ ] functional :zzz:
    - [ ] model
    - [ ] inheritAttrs
    - [ ] comments :zzz:
- Class
  - [x] methods
  - [x] data properties
  - [x] getters/setters
  - Lifecycle hooks
    - [x] beforeCreate
    - [x] created
    - [x] beforeMount
    - [x] mounted
    - [x] beforeUpdate
    - [x] updated
    - [x] activated
    - [x] deactivated
    - [x] beforeDestroy
    - [x] destroyed
    - [x] errorCaptured
  - [ ] Mixins
  - [x] `$refs`
  - [ ] `this` -> props or variables
    - [ ] `$attrs`
    - [ ] `$data`
    - [ ] `$emit`
    - [ ] `$nextTick`
    - [ ] `$props`
    - [ ] `$route`
    - [ ] `$router`
    - [ ] `$slots`
    - [ ] `$store`
    - [ ] `$watch`
  - [ ] sort by dependency

### vue-property-decorator

- [ ] `@Prop`
- [ ] `@PropSync`
- [ ] `@Model`
- [ ] `@Watch`
- [ ] `@Provde` / `@Inject`
- [ ] `@ProvideReactive` / `@InjectReactive`
- [ ] `@Emit`
- [ ] `@Ref`

### vuex-class

- [ ] `@Action`
- [ ] `@Getter`
- [ ] `@Mutation`
- [ ] `@State`
- `namespace`
  - [ ] `@Ns.Action`
  - [ ] `@Ns.Getter`
  - [ ] `@Ns.Mutation`
  - [ ] `@Ns.State`

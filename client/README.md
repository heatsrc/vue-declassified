# Vexus

## Convert Vue Class Components to Vue 3 script setup

Vexus is an opinionated tool that will format Vue class components to script setup. Vexus is heavily influence by the great work of yoyo930021: https://github.com/yoyo930021/vc2c

### Opinionated decisions

These decisions are made arbitrarily, mostly for sanity and convenience.

- Will only support TS
- Won't support esoteric `@Component` options (e.g., render, intervalHooks, etc)
  - Will consider accepting PRs
- Will order files `script` -> `template` -> `style`
- Will be formatted by prettier with default config
  - exception `printWidth` increased to 100 characters
- Will attempt to preserve untransformed code
  - Won't guarantee correctness though
  - Will try to flag with comments

### Supported Features

### vue-class-component

- `@Options` / `@Component`
  - [ ] props
    - [ ] `PropType<...>`
  - [ ] data
  - [ ] computed
  - [ ] methods
  - [ ] `$refs`
  - [ ] watch
  - [ ] lifecycle hooks
  - [ ] provide / inject
  - [ ] mixins
  - [ ] extends
- Class
  - [x] methods
  - [x] data properties
  - [x] getters/setters
  - [ ] lifecycle hooks
  - [ ] Mixins
  - [x] `$refs`
  - [ ] `this` -> props or variables
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

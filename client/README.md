# Vexus

## Convert Vue Class Components to Vue 3 script setup

Vexus is an opinionated tool that will format Vue class components to script setup. Vexus is heavily influence by the great work of yoyo930021: https://github.com/yoyo930021/vc2c

### Opinionated decisions

These decisions are made arbitrarily, mostly for sanity and convenience.

- Will only support TS
- Will order files `script` -> `template` -> `style`
- Will be formatted by prettier with default config
  - exception `printWidth` increased to 100 characters

### Supported Features

### vue-class-component

- `@Options` / `@Component`
  - [ ] props
    - [ ] `PropType<...>`
  - [x] data
  - [x] computed
  - [x] methods
  - [x] `$refs`
  - [ ] watch
  - [ ] lifecycle hooks
  - [ ] provide / inject
  - [ ] mixins
  - [ ] extends
- Class
  - [ ] methods
  - [ ] data properties
  - [ ] getters
  - [ ] lifecycle hooks
  - [ ] Mixins
  - [ ] `$refs`
  - [ ] `this` -> props or variables
  - [ ] sort by dependency
  - [ ] render

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

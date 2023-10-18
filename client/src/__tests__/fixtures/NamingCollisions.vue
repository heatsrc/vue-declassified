<script lang="ts">
import { Component, Inject, Ref, Vue } from "vue-property-decorator";
import { Action } from "vuex-class";
import { baz } from "./baz";
import foo from "./foo";

const {
  qux,
  okay: { haptic },
} = { qux: "qux" };
const [quux, { car }] = ["quux", { car: "car" }];

@Component
export default class NamingCollisions extends Vue {
  $refs!: {
    baz: HTMLDivElement;
  };

  foo = "string";
  baz = baz;

  get bar() {
    return "string";
  }

  qux() {
    return 1;
  }

  @Ref() quux: HTMLDivElement;

  @Inject("vehicle") car: string;

  @Action() haptic: () => void;
}
</script>

<template>
  <div>{{ foo }}</div>
</template>

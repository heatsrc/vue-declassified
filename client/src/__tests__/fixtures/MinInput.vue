<style lang="scss" scoped>
.foo {
  color: red;
}
</style>

<template>
  <div class="foo">{{ hello }}</div>
</template>

<script lang="ts">
import { Options } from "vue-class-component";
@Options()
export default class MinInput extends Vue {
  hello = "helloworld";
}
</script>

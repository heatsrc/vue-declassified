<template>
  <div>{{}}</div>
</template>

<script lang="ts">
// @ts-expect-error
const foo = (foo: bar: buzz) => {};
</script>

<script lang="ts">
import { mixins as Mixins, Options, Watch } from "vue-property-decorator";
import MyOther from './MyOther';
import MySpecialMixin from "./MySpecialMixin";

@Options({})
export default class MyComponent extends Mixins(MySpecialMixin, MyOther) {
  get myFoo() {
    return this.foo;
  }

  @Watch('bar')
  onBarChanged(newVal: number, oldVal: number) {
    console.log(`bar changed ${this.bar} vs ${oldVal}`);
    this.fetchData();
  }

  mounted() {
    this.foo = this.baz === 1 ? 'foo' : 'bar';
  }
</script>

<template>
  <div>{{ myFoo }}</div>
</template>

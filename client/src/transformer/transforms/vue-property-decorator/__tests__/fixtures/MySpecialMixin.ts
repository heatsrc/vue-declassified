import { Options, Vue } from "vue-class-component";

export type MySpecialType = "foo" | "bar";
@Options({})
export default class MySpecialMixin extends Vue {
  foo: MySpecialType = "bar";

  async fetchData() {
    const resp = await fetch("https://example.com/foo");
    this.foo = (await resp.text()) as MySpecialType;
  }
}

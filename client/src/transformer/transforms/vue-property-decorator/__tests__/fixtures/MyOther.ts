import { Options, Vue } from "vue-class-component";

@Options({})
export default class MyOther extends Vue {
  bar: number = 0;

  get baz() {
    return this.bar;
  }
}

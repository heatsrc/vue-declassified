import { convertSfc } from "./main.js";

const source = process.argv[2];
const dest = process.argv[3] ?? source.replace(/\.vue$/, ".converted.vue");

convertSfc(source, dest);

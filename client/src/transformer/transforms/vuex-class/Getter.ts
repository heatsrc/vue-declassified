import { convertVuexComputedFactory } from "./utils/convertVuexComputedFactory";

export const transformVuexGetter = convertVuexComputedFactory("Getter", "getters");

import { convertVuexComputedFactory } from "./utils/convertVuexComputedFactory";

export const transformVuexState = convertVuexComputedFactory("State", "state");

import { transformVuexMethodFactory } from "./utils/convertVuexMethodFactory";

export const transformVuexAction = transformVuexMethodFactory("Action", "dispatch");

import { transformVuexMethodFactory } from "./utils/convertVuexMethodFactory";

export const transformVuexMutation = transformVuexMethodFactory("Mutation", "commit");

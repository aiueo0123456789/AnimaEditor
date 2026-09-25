import { ID } from "../../editor/Editor";
import { ModelNames } from "./Project";

export interface ModelInput {
  modelName: ModelNames;
  name?: string,
  id?: ID
}

export interface ModelReferenceInput {
  modelID: ID;
}

export class ModelReference {
  public modelID: ID;
  constructor(data: ModelReferenceInput) {
    this.modelID = data.modelID;
  }
}

export class Model {
  public modelName: ModelNames;
  public isModel: boolean;
  public name: string;
  public id: ID;
  constructor(data: ModelInput) {
    this.isModel = true;

    this.modelName = data.modelName;

    this.name = data?.name ?? "名称未設定";
    this.id = data.id ?? crypto.randomUUID();
  }
}

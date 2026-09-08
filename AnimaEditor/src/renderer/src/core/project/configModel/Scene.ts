import { Vec3, Vec3Math } from "../../../util/vecMath";
import { Model } from "../Model";
import { ModelNames } from "../Project";

export interface Model_SceneConfigInput {
  projectName?: string
}

export class Model_SceneConfig extends Model {
  public backGroundColor: Vec3;
  public projectName: string;

  constructor(data: Model_SceneConfigInput) {
    super({ modelName: ModelNames.SceneConfig, name: "SceneConfig" });
    this.backGroundColor = Vec3Math.create();
    this.projectName = data.projectName ?? "名称未設定";
  }
}

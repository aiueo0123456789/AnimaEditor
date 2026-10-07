import { ID } from "../../../editor/Editor";
import { Color, ColorMath } from "../../../util/color";
import { Model } from "../Model";
import { ModelNames } from "../Project";

export interface Model_SceneConfigInput {
  projectName?: string,
  masks?: Record<ID, ConstructorParameters<typeof Mask>[0]>
}

class Mask {
  public name: string;
  public strength: number;
  constructor(data: {name: string; strength?: number}) {
    this.name = data.name;
    this.strength = Number.isFinite(data.strength) ? Math.max(0, Math.min(1, data.strength!)) : 1;
  }
}

export interface MaskReferenceInput {
  maskID: ID
}

export class MaskReference {
  public maskID: ID;
  constructor(data: MaskReferenceInput) {
    this.maskID = data.maskID;
  }
}

export class Model_SceneConfig extends Model {
  static createMask(data: ConstructorParameters<typeof Mask>[0]) {
    return new Mask(data);
  }
  static Mask = Mask;
  public backGroundColor: Color;
  public projectName: string;
  public masks: Record<ID, Mask>;

  constructor(data: Model_SceneConfigInput) {
    super({ modelName: ModelNames.SceneConfig, name: "SceneConfig" });
    this.backGroundColor = ColorMath.create();
    this.projectName = data.projectName ?? "名称未設定";

    this.masks = data.masks ? Object.fromEntries(Object.entries(data.masks).map(([maskID, maskData]) => [maskID, Model_SceneConfig.createMask(maskData)])) : {};
  }
}

export namespace Model_SceneConfig {
  export type Mask = InstanceType<typeof Mask>;
}

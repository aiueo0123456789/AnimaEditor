import type { ID } from "../../../editor/Editor";
import { Model_SceneConfig } from "../../project/configModel/Scene";
import type { System_Runtime_ReferencesResolver } from "../../system/runtime/Runtime";
import { Runtime } from "../Runtime";

class Mask {
  public strength = 1;
  constructor(public readonly id: ID, public model: Model_SceneConfig.Mask) {
  }
}

export class Runtime_SceneConfig extends Runtime<Model_SceneConfig> {
  static Mask = Mask;
  static createMask(id: ID, model: Model_SceneConfig.Mask): Mask { return new Mask(id, model); }

  public currentFrame: number;
  public isPlay: boolean;
  public masks: Mask[] = [];
  public maskIDMap: Map<ID, number> = new Map();
  constructor(model: Model_SceneConfig) {
    super(model);
    this.currentFrame = 0;
    this.isPlay = false;
  }

  resolveReferences(_referencesResolver: System_Runtime_ReferencesResolver): void {}
}

export namespace Runtime_SceneConfig {
  export type Mask = InstanceType<typeof Mask>;
}

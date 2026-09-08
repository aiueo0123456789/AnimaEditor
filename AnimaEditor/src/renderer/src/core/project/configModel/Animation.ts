import { Model } from "../Model";
import { ModelNames } from "../Project";

export interface Model_AnimationConfigInput {
  frameStart?: number;
  frameEnd?: number;
  frameSpeed?: number;
}

export class Model_AnimationConfig extends Model {
  public frameStart: number;
  public frameEnd: number;
  public frameSpeed: number;
  constructor(data: Model_AnimationConfigInput) {
    super({ modelName: ModelNames.AnimationConfig, name: "AnimationConfig" });
    this.frameStart = data.frameStart ?? 0;
    this.frameEnd = data.frameEnd ?? 100;
    this.frameSpeed = data.frameSpeed ?? 0.1;
  }
}
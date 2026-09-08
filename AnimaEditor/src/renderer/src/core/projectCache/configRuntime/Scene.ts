import { Model_SceneConfig } from "../../project/configModel/Scene.js";
import { Runtime } from "../Runtime.js";

export class SceneConfigRuntime extends Runtime {
  public currentFrame: number;
  public isPlay: boolean;
  constructor(model: Model_SceneConfig) {
    super(model);
    this.currentFrame = 0;
    this.isPlay = false;
  }
}
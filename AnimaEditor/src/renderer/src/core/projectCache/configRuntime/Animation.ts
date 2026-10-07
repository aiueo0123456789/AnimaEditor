import { Model_AnimationConfig } from "../../project/configModel/Animation.js";
import { System_Runtime_ReferencesResolver } from "../../system/runtime/Runtime.js";
import { Runtime } from "../Runtime.js";

export class Runtime_AnimationConfig extends Runtime<Model_AnimationConfig> {
  constructor() {
    super({});
    this.frameStart = 0;
    this.frameEnd = 100;
    this.frameSpeed = 0.1;
  }

  resolveReferences(referencesResolver: System_Runtime_ReferencesResolver): void {}
}

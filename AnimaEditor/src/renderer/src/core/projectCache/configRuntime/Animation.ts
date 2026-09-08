import { Runtime } from "../Runtime.js";

export class AnimationConfigRuntime extends Runtime {
  constructor() {
    super({});
    this.frameStart = 0;
    this.frameEnd = 100;
    this.frameSpeed = 0.1;
  }
}

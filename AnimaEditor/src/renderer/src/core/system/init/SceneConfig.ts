import { Runtime_SceneConfig } from "../../projectCache/configRuntime/Scene";
import { System } from "../System";

/** Keeps saved SceneConfig data and its evaluated runtime representation aligned. */
export class System_Init_SceneConfig extends System {
  public override start(): void {}
  public override end(): void {}

  public override update(): void {
    const model = this.editor.project.sceneConfig;
    const runtime = this.editor.projectCache.sceneConfig;
    runtime.model = model;
    runtime.id = model.id;

    const previous = new Map(runtime.masks.map(mask => [mask.id, mask]));
    runtime.maskIDMap.clear();
    const masks = Object.entries(model.masks).map(([id, modelMask], index) => {
      const mask = previous.get(id) ?? Runtime_SceneConfig.createMask(id, modelMask);
      mask.model = modelMask;
      mask.strength = Number.isFinite(modelMask.strength) ? Math.max(0, Math.min(1, modelMask.strength)) : 1;
      runtime.maskIDMap.set(id, index);
      return mask;
    });
    runtime.masks.splice(0, runtime.masks.length, ...masks);
  }
}

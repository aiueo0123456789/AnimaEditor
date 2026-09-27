import { AnimaEditor } from "../../../editor/Editor";
import { Runtime_Armature } from "../../projectCache/runtime/Armature";
import { Runtime_Sprite } from "../../projectCache/runtime/Sprite";
import { System } from "../System";

/**
 * 評価済みのTrack値を各Runtimeへ反映する
 */
export class System_ApplyAnimation extends System {
  private _lastFrame = Infinity;
  constructor(editor: AnimaEditor) {
    super(editor);
  }

  public override start(): void {
  }

  public override end(): void {
  }

  public override update(): void {
    const projectCache = this.editor.projectCache;
    const currentFrame = projectCache.sceneConfig.currentFrame;
    if (this._lastFrame !== currentFrame) {
      for (const runtime of projectCache.getRuntimesByType(Runtime_Armature)) runtime.setAnimation();
      for (const runtime of projectCache.getRuntimesByType(Runtime_Sprite)) runtime.setAnimation();
    }
    this._lastFrame = currentFrame;
  }
}

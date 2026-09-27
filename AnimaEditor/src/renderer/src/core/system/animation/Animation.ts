import { AnimaEditor } from "../../../editor/Editor";
import { Runtime_Animation } from "../../projectCache/runtime/Animation";
import { System } from "../System";

export class System_Animation extends System {
  constructor(editor: AnimaEditor) {
    super(editor);
  }

  public override start(): void {}
  public override end(): void {}

  private getValue(frame: number, keys: Runtime_Animation.Keyframe[]): number | undefined {
    if (!keys.length || !Number.isFinite(frame)) return undefined;
    let low = 0, high = keys.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (keys[middle].frame <= frame) low = middle + 1;
      else high = middle;
    }
    if (low === 0) return keys[0].value;
    const left = keys[low - 1], right = keys[low];
    if (!right) return left.value;
    const t = (frame - left.frame) / (right.frame - left.frame);
    return left.value + (right.value - left.value) * t;
  }

  public override update(): void {
    const scene = this.editor.projectCache.sceneConfig;
    const config = this.editor.project.animationConfig;
    if (scene.isPlay) {
      const duration = config.frameEnd - config.frameStart;
      if (Number.isFinite(duration) && duration > 0 && Number.isFinite(config.frameSpeed)) {
        const frame = Number.isFinite(scene.currentFrame) ? scene.currentFrame : config.frameStart;
        scene.currentFrame = config.frameStart + ((frame + config.frameSpeed - config.frameStart) % duration + duration) % duration;
      } else {
        scene.currentFrame = Number.isFinite(config.frameStart) ? config.frameStart : 0;
        scene.isPlay = false;
      }
    }
    for (const animation of this.editor.projectCache.getRuntimesByType(Runtime_Animation)) {
      for (const track of animation.tracks) track.value = this.getValue(scene.currentFrame, track.keyframes);
    }
  }
}

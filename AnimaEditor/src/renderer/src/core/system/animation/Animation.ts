import { AnimaEditor } from "../../../editor/Editor";
import { Runtime_Animation } from "../../projectCache/runtime/Animation";
import { System } from "../System";

export class System_Animation extends System {
  constructor(editor: AnimaEditor) {
    super(editor);
  }

  public override start(): void {
  }

  public override end(): void {
  }

  public override update(): void {
    const currentFrame = this.editor.projectCache.sceneConfig.currentFrame;
    if (this.editor.projectCache.sceneConfig.isPlay) {
      this.editor.projectCache.sceneConfig.currentFrame =
        (currentFrame + this.editor.project.animationConfig.frameSpeed - this.editor.project.animationConfig.frameStart) %
        (this.editor.project.animationConfig.frameEnd - this.editor.project.animationConfig.frameStart) +
        this.editor.project.animationConfig.frameStart;
    }

    for (const animation of this.editor.projectCache.getRuntimesByType(Runtime_Animation)) {
      let target = animation.target;
      const model = animation.model;
      if (model.keyframes.length === 0) continue ;
      const path = model.path.split(".");
      for (const key of path.slice(0, -1)) {
        target = target[key];
      }
      const keyframes = model.keyframes;
      let rightKeyframe = keyframes[0];
      let leftKeyframe = keyframes[0];
      for (const keyframe of keyframes.slice(1)) {
        leftKeyframe = rightKeyframe;
        rightKeyframe = keyframe;
        if (currentFrame < keyframe.frame) {
          break;
        }
      }
      const t = Math.max(
        0,
        Math.min(
          1,
          (currentFrame - leftKeyframe.frame) / (rightKeyframe.frame - leftKeyframe.frame),
        ),
      );

      const lastPath = path[path.length - 1];
      target[lastPath] = leftKeyframe.value + (rightKeyframe.value - leftKeyframe.value) * t;
      // console.log(target, lastPath)
    }
  }
}

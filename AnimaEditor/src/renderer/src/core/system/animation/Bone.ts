import { AnimaEditor } from "../../../editor/Editor";
import { Mat3Math, Vec2Math } from "../../../util/vecMath";
import { Runtime_Armature } from "../../projectCache/runtime/Armature";
import { getMatrixByTransform, getTransformByMatrix } from "../init/Armature";
import { System } from "../System";

/**
 * ランタイムボーンの伝播
 */
export class System_Bone extends System {
  constructor(editor: AnimaEditor) {
    super(editor);
  }

  public override start(): void {
  }

  public override end(): void {
  }

  public override update(): void {
    const targets = this.editor.projectCache.getRuntimesByType(Runtime_Armature);
    for (const runtime of targets) {
      for (const rb of runtime.bones) {
        const localdMatrix = getMatrixByTransform(rb.animation.position, rb.animation.rotation, Vec2Math.add(rb.animation.scale, Vec2Math.create(1, 1)));
        Mat3Math.copy(localdMatrix, rb.animation.localMatrix);
        Mat3Math.multiply(rb.base.localMatrix, rb.animation.localMatrix, rb.pose.localMatrix);
      }
      for (const rb of runtime.bones) {
        if (rb.parent) Mat3Math.multiply(rb.parent.pose.worldMatrix, rb.pose.localMatrix, rb.pose.worldMatrix);
        else Mat3Math.copy(rb.pose.localMatrix, rb.pose.worldMatrix);
        Mat3Math.inverse(rb.pose.worldMatrix, rb.pose.inverWorldMatrix);
        const transform = getTransformByMatrix(rb.pose.worldMatrix);
        Vec2Math.copy(transform.position, rb.pose.position);
        Vec2Math.copy(transform.scale, rb.pose.scale);
        rb.pose.rotation = transform.rotation;
      }
    }
  }
}

import type { AnimaEditor } from "../../Editor";
import { Runtime_Armature } from "../../../core/projectCache/runtime/Armature";
import { Mat3Math, type Mat3, type Vec2 } from "../../../util/vecMath";
import { getMatrixByTransform, getTransformByMatrix } from "../../../core/system/init/Armature";
import { CommandReturn } from "../primitiveCommand/PrimitiveCommand";
import { updatePreview } from "../updatePreview";
import { InteractionCommand } from "./InteractionCommand";

type Pose = { position: Vec2; rotation: number; scale: Vec2 };
interface Snapshot { id: string; parentMoves: boolean; world: Mat3; parentWorld: Mat3; baseLocal: Mat3; before: Pose; }

// Convert a world-space gesture back to local animation channels, without editing the Model.
export class BonePoseTransformCommand extends InteractionCommand {
  private snapshots: Snapshot[] = [];
  private after: Pose[] = [];
  constructor(editor: AnimaEditor, private data: { runtime: Runtime_Armature; ids: string[]; pivot: Vec2 }) {
    super(editor, data);
  }
  public begin(): CommandReturn {
    this.snapshots = this.data.ids.flatMap(id => {
      const bone = this.data.runtime.getBoneByID(id);
      let parent = bone?.parent;
      let parentMoves = false;
      const visited = new Set<string>();
      while (parent && !visited.has(parent.id)) {
        visited.add(parent.id);
        parentMoves ||= this.data.ids.includes(parent.id);
        parent = parent.parent;
      }
      return bone ? [{ id, parentMoves,
        world: Mat3Math.copy(bone.pose.worldMatrix), parentWorld: Mat3Math.copy(bone.parent?.pose.worldMatrix ?? Mat3Math.identity()),
        baseLocal: Mat3Math.copy(bone.base.localMatrix),
        before: { position: [...bone.animation.position] as Vec2, rotation: bone.animation.rotation, scale: [...bone.animation.scale] as Vec2 } }] : [];
    });
    if (this.snapshots.some(item => {
      const matrix = Mat3Math.multiply(item.parentWorld, item.baseLocal);
      return ![...matrix, ...item.world].every(Number.isFinite) ||
        Math.abs(matrix[0] * matrix[4] - matrix[1] * matrix[3]) < 1e-10 ||
        Math.abs(item.world[0] * item.world[4] - item.world[1] * item.world[3]) < 1e-10;
    })) return CommandReturn.ERROR;
    this.after = this.snapshots.map(item => item.before);
    return this.snapshots.length ? CommandReturn.FINISHED : CommandReturn.ERROR;
  }
  public update(data: { movement?: Vec2; angle?: number; scale?: number }): CommandReturn {
    const movement = data.movement ?? [0, 0], angle = data.angle ?? 0, scale = data.scale ?? 1;
    if (![...movement, angle, scale].every(Number.isFinite) || scale <= 0) return CommandReturn.ERROR;
    const pivot = this.data.pivot;
    const delta = Mat3Math.multiply(getMatrixByTransform([pivot[0] + movement[0], pivot[1] + movement[1]], angle, [scale, scale]),
      Mat3Math.translation([-pivot[0], -pivot[1]]));
    const worlds = new Map(this.snapshots.map(item => [item.id, Mat3Math.multiply(delta, item.world)]));
    const after: Pose[] = this.snapshots.map(item => {
        // A selected parent already carries its child's world-space gesture.
        const parent = item.parentMoves ? Mat3Math.multiply(delta, item.parentWorld) : item.parentWorld;
        const local = Mat3Math.multiply(Mat3Math.inverse(Mat3Math.multiply(parent, item.baseLocal)), worlds.get(item.id)!);
        const pose = getTransformByMatrix(local);
        return { position: pose.position, rotation: pose.rotation, scale: [pose.scale[0] - 1, pose.scale[1] - 1] };
    });
    if (after.some(pose => ![...pose.position, pose.rotation, ...pose.scale].every(Number.isFinite))) return CommandReturn.ERROR;
    return updatePreview(this, () => { this.after = after; });
  }
  private apply(poses: Pose[]): CommandReturn {
    const runtime = this.data.runtime;
    const indices = this.snapshots.map(item => runtime.bones.findIndex(bone => bone.id === item.id));
    if (indices.some(index => index < 0)) return CommandReturn.ERROR;
    poses.forEach((pose, i) => {
      const path = `bones.${indices[i]}.animation`;
      this.api.setPropertyVec2(runtime, `${path}.position`, pose.position);
      this.api.setProperty(runtime, `${path}.rotation`, pose.rotation);
      this.api.setPropertyVec2(runtime, `${path}.scale`, pose.scale);
    });
    return CommandReturn.FINISHED;
  }
  public redo(): CommandReturn { return this.apply(this.after); }
  public undo(): CommandReturn { return this.apply(this.snapshots.map(item => item.before)); }
  public cancel(): CommandReturn { return this.commited ? CommandReturn.ERROR : this.undo(); }
}

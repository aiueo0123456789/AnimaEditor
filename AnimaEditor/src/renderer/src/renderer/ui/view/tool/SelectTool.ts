import { Model_Sprite } from "../../../../core/project/model/Sprite";
import { Model_Armature } from "../../../../core/project/model/Armature";
import { SpriteState } from "../../../../editor/editorState/state/States/Sprite";
import { ArmatureState } from "../../../../editor/editorState/state/States/Armature";
import { SetPropertiesCommand } from "../../../../editor/command/interactionCommand/SetPropertiesCommand";
import type { AnimaEditor, ID } from "../../../../editor/Editor";
import type { CommandRecorder } from "../../../../manager/CommandManager";
import { InputManager } from "../../../../manager/InputManager";
import type { UIComponent_View } from "../View";
import { Vec2Math, type Vec2 } from "../../../../util/vecMath";
import { DragTool } from "./DragTool";

export class SelectTool extends DragTool {
  private points: { position: Vec2; id: ID; group: number }[] = [];
  private bones: { id: ID; head: Vec2; tail: Vec2 }[] = [];
  private initial: ID[][] = [];
  private box = false;
  protected start(editor: AnimaEditor, _view: UIComponent_View, recorder: CommandRecorder): void {
    const model = editor.editorState.activeObject;
    if (!model) return;
    const state = editor.editorState.getModelStateByID(model.id);
    const input = editor.getManager(InputManager)!;
    const additive = input.getKey("ShiftLeft") || input.getKey("ShiftRight");
    this.points = [];
    this.bones = [];
    let paths: string[] = [];
    if (model instanceof Model_Sprite && state instanceof SpriteState) {
      paths = ["selectedVertexIDs"];
      this.initial = [additive ? [...state.selectedVertexIDs] : []];
      this.points = Object.entries(model.vertices).map(([id, vertex]) => ({ position: [...vertex.co], id, group: 0 }));
    } else if (model instanceof Model_Armature && state instanceof ArmatureState) {
      paths = ["selectedHeadIDs", "selectedTailIDs"];
      this.initial = additive ? [[...state.selectedHeadIDs], [...state.selectedTailIDs]] : [[], []];
      Object.entries(model.bones).forEach(([id, bone]) => {
        this.bones.push({ id, head: [...bone.head], tail: [...bone.tail] });
        this.points.push({ position: [...bone.head], id, group: 0 }, { position: [...bone.tail], id, group: 1 });
      });
    }
    this.box = false;
    if (paths.length) recorder.setCommand(SetPropertiesCommand, { edits: paths.map((path, i) => ({ model: state, path, value: this.initial[i] })) });
  }
  protected move(_editor: AnimaEditor, view: UIComponent_View, input: InputManager, recorder: CommandRecorder): void {
    const point = view.clientToWorld(input.mousePosition);
    this.box ||= Vec2Math.distance(this.origin, point) * view.camera.zoom > 4;
    const selected = this.initial.map(indices => new Set(indices));
    if (this.box) {
      const min = Vec2Math.min(this.origin, point), max = Vec2Math.max(this.origin, point);
      for (const item of this.points) if (item.position[0] >= min[0] && item.position[0] <= max[0] && item.position[1] >= min[1] && item.position[1] <= max[1]) selected[item.group].add(item.id);
    } else {
      let closest: typeof this.points[number] | undefined;
      let distance = 12 / view.camera.zoom;
      for (const item of this.points) {
        const d = Vec2Math.distance(item.position, point);
        if (d <= distance) { closest = item; distance = d; }
      }
      if (closest) selected[closest.group].add(closest.id);
      else {
        // ボーン選択処理
        let boneID: ID | undefined;
        let nearest = 8 / view.camera.zoom;
        for (const bone of this.bones) {
          const dx = bone.tail[0] - bone.head[0], dy = bone.tail[1] - bone.head[1];
          const lengthSquared = dx * dx + dy * dy;
          if (!lengthSquared) continue;
          const t = Math.max(0, Math.min(1,
            ((point[0] - bone.head[0]) * dx + (point[1] - bone.head[1]) * dy) / lengthSquared));
          const distance = Math.hypot(point[0] - bone.head[0] - t * dx, point[1] - bone.head[1] - t * dy);
          if (distance <= nearest) { boneID = bone.id; nearest = distance; }
        }
        if (boneID !== undefined) {
          selected[0].add(boneID);
          selected[1].add(boneID);
        }
      }
    }
    recorder.updateCommand({ values: selected.map(indices => [...indices]) });
  }
}

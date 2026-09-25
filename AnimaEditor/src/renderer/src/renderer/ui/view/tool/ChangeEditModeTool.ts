import { Model_Sprite } from "../../../../core/project/model/Sprite";
import { SpriteState } from "../../../../editor/editorState/state/States/Sprite";
import { AddBoneWeightPaintCommand } from "../../../../editor/command/interactionCommand/AddWeightPaintCommand";
import type { AnimaEditor } from "../../../../editor/Editor";
import type { CommandRecorder } from "../../../../manager/CommandManager";
import type { InputManager } from "../../../../manager/InputManager";
import type { UIComponent_View } from "../View";
import { Vec2Math } from "../../../../util/vecMath";
import { DragTool } from "./DragTool";

export class ChangeEditModeTool extends DragTool {
  private deltas: Record<string, number> = {};
  private weightID = "";
  protected start(editor: AnimaEditor, _view: UIComponent_View, recorder: CommandRecorder): void {
    const model = editor.editorState.activeObject;
    if (!(model instanceof Model_Sprite)) return;
    const state = editor.editorState.getModelStateByID(model.id);
    if (!(state instanceof SpriteState) || !model.boneWeights[state.activeBoneWeightID]) return;
    this.weightID = state.activeBoneWeightID;
    this.deltas = {};
    recorder.setCommand(AddBoneWeightPaintCommand, { model, bone: this.weightID });
  }
  protected move(editor: AnimaEditor, view: UIComponent_View, input: InputManager, recorder: CommandRecorder): void {
    const model = editor.editorState.activeObject;
    if (!(model instanceof Model_Sprite)) return;
    const state = editor.editorState.getModelStateByID(model.id);
    if (!(state instanceof SpriteState) || state.activeBoneWeightID !== this.weightID) { this.deactivate(); return; }
    if (!input.getKey("Mouse0")) return;
    const point = view.clientToWorld(input.mousePosition);
    const radius = 100 / view.camera.zoom;
    const amount = Math.min(.1, Math.max(0, editor.deltaTime || 1 / 60)) * (input.getKey("ShiftLeft") || input.getKey("ShiftRight") ? -1 : 1);
    for (const [vertexID, vertex] of Object.entries(model.vertices)) {
      const distance = Vec2Math.distance(vertex.co, point);
      if (distance < radius) this.deltas[vertexID] = (this.deltas[vertexID] ?? 0) + amount * (1 - distance / radius) ** 2;
    }
    recorder.updateCommand({ paintingWeights: this.deltas });
  }
}

import { Model_Sprite } from "../../../../core/project/model/Sprite";
import { SpriteState } from "../../../../editor/editorState/state/States/Sprite";
import { AddBoneWeightPaintCommand } from "../../../../editor/command/interactionCommand/AddWeightPaintCommand";
import type { AnimaEditor } from "../../../../editor/Editor";
import type { CommandRecorder } from "../../../../manager/CommandManager";
import type { InputManager } from "../../../../manager/InputManager";
import type { UIComponent_View } from "../View";
import { Vec2Math } from "../../../../util/vecMath";
import { DragTool } from "./DragTool";
import { Runtime_Sprite } from "../../../../core/projectCache/runtime/Sprite";
import { geometrySource, spritePoints } from "../ViewGeometry";
import { Column, NumberField, type Widget } from "../../../../manager/ui/components";

export class WeightPaintTool extends DragTool {
  public override readonly id = "WeightPaint";
  public override readonly label = "ウェイトペイント";
  public override readonly icon = "addPoint";
  public readonly params = { radius: 100, strength: 1, falloff: 2 };
  private deltas: Record<string, number> = {};
  private weightID = "";

  public override createParamsWidget(_editor: AnimaEditor): Widget {
    const set = (key: keyof typeof this.params, value: number, min: number, max: number): void => {
      this.params[key] = Math.max(min, Math.min(max, value));
      this.changed();
    };
    return Column({ className: "ui-tool-params", gap: 4, children: [
      NumberField({ label: "範囲", value: this.params.radius, min: 1, max: 1000, step: 1,
        onChange: () => {}, onCommit: value => set("radius", value, 1, 1000) }),
      NumberField({ label: "強度", value: this.params.strength, min: 0, max: 10, step: .1,
        onChange: () => {}, onCommit: value => set("strength", value, 0, 10) }),
      NumberField({ label: "減衰", value: this.params.falloff, min: .1, max: 10, step: .1,
        onChange: () => {}, onCommit: value => set("falloff", value, .1, 10) }),
    ] });
  }
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
    const radius = this.params.radius / view.camera.zoom;
    const amount = Math.min(.1, Math.max(0, editor.deltaTime || 1 / 60)) * this.params.strength *
      (input.getKey("ShiftLeft") || input.getKey("ShiftRight") ? -1 : 1);
    const runtime = editor.projectCache.getRuntimeByID(model.id);
    for (const { id: vertexID, position } of spritePoints(model, runtime instanceof Runtime_Sprite ? runtime : null, geometrySource(editor.editorState.editMode))) {
      const distance = Vec2Math.distance(position, point);
      if (distance < radius) this.deltas[vertexID] = (this.deltas[vertexID] ?? 0) +
        amount * (1 - distance / radius) ** this.params.falloff;
    }
    recorder.updateCommand({ paintingWeights: this.deltas });
  }
}

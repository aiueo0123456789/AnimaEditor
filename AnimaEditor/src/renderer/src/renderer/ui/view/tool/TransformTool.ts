import { Model_Sprite } from "../../../../core/project/model/Sprite";
import { Model_Armature } from "../../../../core/project/model/Armature";
import { SpriteState } from "../../../../editor/editorState/state/States/Sprite";
import { ArmatureState } from "../../../../editor/editorState/state/States/Armature";
import { TranslateCommand } from "../../../../editor/command/interactionCommand/TranslateCommand";
import type { TranslateTarget } from "../../../../editor/command/interactionCommand/TranslateCommand";
import { TransformCommand } from "../../../../editor/command/interactionCommand/TransformCommand";
import type { AnimaEditor } from "../../../../editor/Editor";
import type { CommandRecorder } from "../../../../manager/CommandManager";
import { InputManager } from "../../../../manager/InputManager";
import type { UIComponent_View } from "../View";
import { Vec2Math, type Vec2 } from "../../../../util/vecMath";
import { SelectionDragTool } from "./SelectionDragTool";
import { ViewEditModes } from "../../../../editor/editorState/ViewEditModes";
import { Runtime_Armature } from "../../../../core/projectCache/runtime/Armature";
import { BonePoseTransformCommand } from "../../../../editor/command/interactionCommand/BonePoseTransformCommand";
import { bonePoints } from "../ViewGeometry";

function elementTarget(model: Model_Sprite | Model_Armature, collection: "vertices" | "bones", id: string, property: string): TranslateTarget {
  return { model, path: `${collection}.${id}.${property}` };
}

export class TransformTool extends SelectionDragTool {
  public override readonly id: string;
  public override readonly label: string;
  public override readonly icon: string;
  private pivot: Vec2 = [0, 0];
  private angle = 0;
  private lastAngle = 0;
  constructor(private readonly mode: "translate" | "rotate" | "scale") {
    super();
    this.id = mode === "rotate" ? "rotation" : mode;
    this.label = mode === "translate" ? "移動" : mode === "rotate" ? "回転" : "拡大縮小";
    this.icon = mode;
  }
  protected start(editor: AnimaEditor, _view: UIComponent_View, recorder: CommandRecorder): void {
    const editMode = editor.editorState.editMode;
    const model = editor.editorState.activeObject;
    if (!model) return;
    const state = editor.editorState.getModelStateByID(model.id);
    const runtime = editor.projectCache.getRuntimeByID(model.id);
    const targets: TranslateTarget[] = [];
    if (editMode === ViewEditModes.BONEANIMATION && model instanceof Model_Armature && state instanceof ArmatureState && runtime instanceof Runtime_Armature) {
      const bones = bonePoints(model, runtime, "runtime").filter(bone => state.selectedBoneIDs.includes(bone.id));
      if (!bones.length) return;
      this.pivot = bones.reduce<Vec2>((sum, bone) => Vec2Math.add(sum, bone.head), [0, 0]);
      this.pivot = [this.pivot[0] / bones.length, this.pivot[1] / bones.length];
      this.angle = 0;
      this.lastAngle = Math.atan2(this.origin[1] - this.pivot[1], this.origin[0] - this.pivot[0]);
      recorder.setCommand(BonePoseTransformCommand, { runtime, ids: bones.map(bone => bone.id), pivot: this.pivot });
      return;
    }
    if (editMode === ViewEditModes.VERTEX && model instanceof Model_Sprite && state instanceof SpriteState) {
      for (const vertexID of Object.keys(model.vertices)) if (state.selectedVertexIDs.includes(vertexID)) targets.push(elementTarget(model, "vertices", vertexID, "co"));
    } else if (model instanceof Model_Armature && state instanceof ArmatureState) {
      if (editMode === ViewEditModes.BONE) {
        for (const [ids, part] of [[state.selectedHeadIDs, "head"], [state.selectedTailIDs, "tail"]] as const) {
          for (const boneID of Object.keys(model.bones)) if (ids.includes(boneID) || state.selectedBoneIDs.includes(boneID)) targets.push(elementTarget(model, "bones", boneID, part));
        }
      }
    }
    if (!targets.length) return;
    this.pivot = [0, 0];
    for (const target of targets) Vec2Math.add(this.pivot, editor.api.getProperty(target.model, target.path) as Vec2, this.pivot);
    this.pivot = [this.pivot[0] / targets.length, this.pivot[1] / targets.length];
    this.angle = 0;
    this.lastAngle = Math.atan2(this.origin[1] - this.pivot[1], this.origin[0] - this.pivot[0]);
    if (this.mode === "translate") recorder.setCommand(TranslateCommand, { targets });
    else recorder.setCommand(TransformCommand, { targets, pivot: this.pivot });
  }
  protected move(_editor: AnimaEditor, view: UIComponent_View, input: InputManager, recorder: CommandRecorder): void {
    const point = view.clientToWorld(input.mousePosition);
    if (this.mode === "translate") recorder.updateCommand({ movement: Vec2Math.sub(point, this.origin) });
    else if (this.mode === "rotate") {
      const angle = Math.atan2(point[1] - this.pivot[1], point[0] - this.pivot[0]);
      this.angle += Math.atan2(Math.sin(angle - this.lastAngle), Math.cos(angle - this.lastAngle));
      this.lastAngle = angle;
      recorder.updateCommand({ angle: this.angle });
    } else {
      const distance = Vec2Math.distance(this.origin, this.pivot);
      const scale = distance > 1e-6 ? Vec2Math.distance(point, this.pivot) / distance : Math.exp((point[0] - this.origin[0]) * view.camera.zoom / 100);
      recorder.updateCommand({ scale: Math.max(.001, Math.min(1000, scale)) });
    }
  }
}

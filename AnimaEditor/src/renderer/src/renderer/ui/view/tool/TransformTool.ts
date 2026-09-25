import { Model_Sprite } from "../../../../core/project/model/Sprite";
import { Model_Armature } from "../../../../core/project/model/Armature";
import { SpriteState } from "../../../../editor/editorState/state/States/Sprite";
import { ArmatureState } from "../../../../editor/editorState/state/States/Armature";
import { TranslateCommand } from "../../../../editor/command/interactionCommand/TranslateCommand";
import type { TranslateTarget } from "../../../../editor/command/interactionCommand/TranslateCommand";
import { TransformCommand } from "../../../../editor/command/interactionCommand/TransformCommand";
import type { AnimaEditor } from "../../../../editor/Editor";
import type { CommandRecorder } from "../../../../manager/CommandManager";
import type { InputManager } from "../../../../manager/InputManager";
import type { UIComponent_View } from "../View";
import { Vec2Math, type Vec2 } from "../../../../util/vecMath";
import { DragTool } from "./DragTool";
import { ViewEditModes } from "../ViewEditModes";
import { Runtime_Armature } from "../../../../core/projectCache/runtime/Armature";

function elementTarget(model: Model_Sprite | Model_Armature | Runtime_Armature, collection: "vertices" | "bones", id: string, property: string): TranslateTarget {
  if (!(model instanceof Runtime_Armature)) return { model, path: `${collection}.${id}.${property}` };
  const resolvePath = (): string => {
    const items = model.bones;
    const index = items.findIndex(item => item.id === id);
    if (index < 0) throw new Error(`Transform target no longer exists: ${id}`);
    return `${collection}.${index}.${property}`;
  };
  return { model, path: resolvePath(), resolvePath };
}

export class TransformTool extends DragTool {
  private pivot: Vec2 = [0, 0];
  private angle = 0;
  private lastAngle = 0;
  constructor(private readonly mode: "translate" | "rotate" | "scale") { super(); }
  protected start(editor: AnimaEditor, _view: UIComponent_View, recorder: CommandRecorder): void {
    const editMode = _view.spaceData.editMode;
    const model = editor.editorState.activeObject;
    if (!model) return;
    const state = editor.editorState.getModelStateByID(model.id);
    const runtime = editor.projectCache.getRuntimesByID(model.id);
    const targets: TranslateTarget[] = [];
    if (editMode === ViewEditModes.VERTEX && model instanceof Model_Sprite && state instanceof SpriteState) {
      for (const vertexID of Object.keys(model.vertices)) if (state.selectedVertexIDs.includes(vertexID)) targets.push(elementTarget(model, "vertices", vertexID, "co"));
    } else if (model instanceof Model_Armature && state instanceof ArmatureState && runtime instanceof Runtime_Armature) {
      if (editMode === ViewEditModes.BONE) {
        for (const [ids, part] of [[state.selectedHeadIDs, "head"], [state.selectedTailIDs, "tail"]] as const) {
          for (const boneID of Object.keys(model.bones)) if (ids.includes(boneID) || state.selectedBoneIDs.includes(boneID)) targets.push(elementTarget(model, "bones", boneID, part));
        }
      } else if (editMode === ViewEditModes.BONEANIMATION) {
        for (const boneID of Object.keys(model.bones)) {
          if (state.selectedBoneIDs.includes(boneID)) {
            if (runtime.boneIDMap.has(boneID))
              targets.push(elementTarget(runtime, "bones", boneID, "animation.position"));
          }
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

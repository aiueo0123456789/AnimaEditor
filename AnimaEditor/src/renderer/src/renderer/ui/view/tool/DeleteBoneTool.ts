import type { AnimaEditor } from "../../../../editor/Editor";
import type { UIComponent_View } from "../View";
import type { InputManager } from "../../../../manager/InputManager";
import { Model_Armature, BoneReference } from "../../../../core/project/model/Armature";
import { Model_Sprite } from "../../../../core/project/model/Sprite";
import { ArmatureState } from "../../../../editor/editorState/state/States/Armature";
import type { PropertyEdit } from "../../../../editor/command/interactionCommand/SetPropertiesCommand";
import { SetPropertiesCommand } from "../../../../editor/command/interactionCommand/SetPropertiesCommand";
import { RemoveValueCommand } from "../../../../editor/command/primitiveCommand/RemoveValue";
import type { CommandRecorder } from "../../../../manager/CommandManager";
import { SelectionDragTool } from "./SelectionDragTool";
export class DeleteBoneTool extends SelectionDragTool {
  public override readonly id = "DeleteBone";
  public override readonly label = "ボーン削除";
  public override readonly icon = "removeBone";
  protected start(editor: AnimaEditor, _view: UIComponent_View, recorder: CommandRecorder): void {
    const model = editor.editorState.activeObject;
    if (!(model instanceof Model_Armature)) return;
    const state = editor.editorState.getModelStateByID(model.id);
    if (!(state instanceof ArmatureState)) return;
    const ids = new Set([...state.selectedBoneIDs, ...state.selectedHeadIDs, ...state.selectedTailIDs].filter(id => Boolean(model.bones[id])));
    if (!ids.size) return;
    const edits: PropertyEdit[] = [];
    if (ids.has(state.activeBoneID)) edits.push({ model: state, path: "activeBoneID", value: "" });
    for (const armature of editor.project.getModelsByType(Model_Armature)) {
        Object.entries(armature.bones).forEach(([boneID, bone]) => {
          if (bone.parentID?.aramatureID === model.id && ids.has(bone.parentID.boneID))
            edits.push({ model: armature, path: `bones.${boneID}.parentID`, value: new BoneReference({ aramatureID: "", boneID: "" }) });
        });
    }
    for (const sprite of editor.project.getModelsByType(Model_Sprite)) Object.entries(sprite.boneWeights).forEach(([boneWeightID, weight]) => {
        if (weight.boneID.aramatureID === model.id && ids.has(weight.boneID.boneID))
          edits.push({ model: sprite, path: `boneWeights.${boneWeightID}.boneID`, value: new BoneReference({ aramatureID: "", boneID: "" }) });
    });
    edits.push({ model, path: "animation.trackMap", value: Object.fromEntries(Object.entries(model.animation.trackMap).filter(([path]) => {
      const parts = path.split(".");
      return parts[0] !== "bones" || !ids.has(parts[1]);
    })) });
    edits.push(
        ...["selectedHeadIDs", "selectedTailIDs"].map(path => ({ model: state, path, value: [] })),
        { model: state, path: "activeVertexID", value: "" });
    for (const id of ids) {
      recorder.setCommand(RemoveValueCommand, { model, path: "bones", removeKey: id });
      if (!recorder.command) return;
      recorder.commitCommand();
    }
    recorder.setCommand(SetPropertiesCommand, { edits });
    if (recorder.command) recorder.commitCommand();
  }
  protected move(_editor: AnimaEditor, _view: UIComponent_View, _input: InputManager, _recorder: CommandRecorder): void {}
}

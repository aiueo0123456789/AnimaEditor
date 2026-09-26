import type { AnimaEditor } from "../../../../editor/Editor";
import type { UIComponent_View } from "../View";
import { InputManager } from "../../../../manager/InputManager";
import { Tool } from "./Tool";
import { Model_Armature, BoneReference } from "../../../../core/project/model/Armature";
import { Model_Sprite } from "../../../../core/project/model/Sprite";
import { Model_Animation } from "../../../../core/project/model/Animation";
import { ArmatureState } from "../../../../editor/editorState/state/States/Armature";
import type { PropertyEdit } from "../../../../editor/command/interactionCommand/SetPropertiesCommand";
import { SetPropertiesCommand } from "../../../../editor/command/interactionCommand/SetPropertiesCommand";
import { RemoveValueCommand } from "../../../../editor/command/primitiveCommand/RemoveValue";
import { CommandManager } from "../../../../manager/CommandManager";
export class DeleteBoneTool extends Tool {
  public override update(editor: AnimaEditor, _view: UIComponent_View): void {
    const model = editor.editorState.activeObject;
    if (!editor.getManager(InputManager)?.getKeyDown("Mouse0") || !(model instanceof Model_Armature)) return;
    const state = editor.editorState.getModelStateByID(model.id);
    if (!(state instanceof ArmatureState)) return;
    const ids = new Set([...state.selectedBoneIDs, ...state.selectedHeadIDs, ...state.selectedTailIDs].filter(id => Boolean(model.bones[id])));
    if (!ids.size) return;
    const edits: PropertyEdit[] = [];
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
    for (const animation of editor.project.getModelsByType(Model_Animation)) {
      if (animation.targetID.modelID !== model.id) continue;
      for (const [trackID, track] of Object.entries(animation.tracks)) {
        const parts = track.path.split(track.path.includes("/") ? "/" : ".");
        if (parts[0] === "bones" && ids.has(parts[1]))
          edits.push({ model: animation, path: `tracks.${trackID}.path`, value: "" });
      }
    }
    edits.push(
        ...["selectedHeadIDs", "selectedTailIDs"].map(path => ({ model: state, path, value: [] })),
        { model: state, path: "activeVertexID", value: "" });
    const manager = editor.getManager(CommandManager);
    if (!manager || manager.commandRecorder) return;
    const recorder = manager.setCommandRecorder("Delete bones");
    if (!recorder) return;
    for (const id of ids) {
      recorder.setCommand(RemoveValueCommand, { model, path: "bones", removeKey: id });
      if (!recorder.command) { manager.cancelCommandRecorder(); return; }
      recorder.commitCommand();
    }
    recorder.setCommand(SetPropertiesCommand, { edits });
    if (!recorder.command) { manager.cancelCommandRecorder(); return; }
    recorder.commitCommand();
    manager.commitCommandRecorder();
  }
}

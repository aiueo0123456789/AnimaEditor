import { Model_Armature } from "../../../../core/project/model/Armature";
import { Runtime_Armature } from "../../../../core/projectCache/runtime/Armature";
import { InsertKeyframeCommand } from "../../../../editor/command/interactionCommand/InsertKeyframeCommand";
import type { AnimaEditor } from "../../../../editor/Editor";
import { ViewEditModes } from "../../../../editor/editorState/ViewEditModes";
import { ArmatureState } from "../../../../editor/editorState/state/States/Armature";
import { CommandManager } from "../../../../manager/CommandManager";
import { InputManager } from "../../../../manager/InputManager";
import type { UIComponent_View } from "../View";
import { Tool } from "./Tool";

export class InsertKeyframeTool extends Tool {
  public override update(editor: AnimaEditor, _view: UIComponent_View): void {
    if (!editor.getManager(InputManager)?.getKeyDown("Mouse0") || editor.editorState.editMode !== ViewEditModes.BONEANIMATION) return;
    const model = editor.editorState.activeObject;
    if (!(model instanceof Model_Armature)) return;
    const state = editor.editorState.getModelStateByID(model.id);
    const runtime = editor.projectCache.getRuntimeByID(model.id);
    if (!(state instanceof ArmatureState) || !(runtime instanceof Runtime_Armature)) return;
    const selected = new Set(state.selectedBoneIDs);
    const paths = Object.keys(model.animation.trackMap).filter(path => {
      const parts = path.split(".");
      return parts[0] === "bones" && parts[2] === "animation" && selected.has(parts[1]);
    });
    if (!paths.length) return;
    const manager = editor.getManager(CommandManager);
    if (!manager || manager.commandRecorder) return;
    const recorder = manager.setCommandRecorder("Insert keyframes");
    if (!recorder) return;
    recorder.setCommand(InsertKeyframeCommand, { target: runtime, frame: editor.projectCache.sceneConfig.currentFrame, paths });
    if (!recorder.command) { manager.cancelCommandRecorder(); return; }
    recorder.commitCommand();
    manager.commitCommandRecorder();
  }
}

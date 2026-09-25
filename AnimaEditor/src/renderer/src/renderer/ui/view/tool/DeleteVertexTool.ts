import type { AnimaEditor } from "../../../../editor/Editor";
import type { UIComponent_View } from "../View";
import { InputManager } from "../../../../manager/InputManager";
import { Tool } from "./Tool";
import { Model_Sprite } from "../../../../core/project/model/Sprite";
import { SpriteState } from "../../../../editor/editorState/state/States/Sprite";
import { CommandManager } from "../../../../manager/CommandManager";
import { RemoveValueCommand } from "../../../../editor/command/primitiveCommand/RemoveValue";
import { SetPropertiesCommand } from "../../../../editor/command/interactionCommand/SetPropertiesCommand";
export class DeleteVertexTool extends Tool {
  public override update(editor: AnimaEditor, _view: UIComponent_View): void {
    const model = editor.editorState.activeObject;
    if (!editor.getManager(InputManager)?.getKeyDown("Mouse0") || !(model instanceof Model_Sprite)) return;
    const state = editor.editorState.getModelStateByID(model.id);
    if (!(state instanceof SpriteState)) return;
    const ids = [...new Set(state.selectedVertexIDs)].filter(id => Boolean(model.vertices[id]));
    if (!ids.length) return;
    const manager = editor.getManager(CommandManager);
    if (!manager || manager.commandRecorder) return;
    const edgeIDs = Object.entries(model.edges).filter(([, edge]) => edge.vertices.some(id => ids.includes(id))).map(([id]) => id);
    const silhouetteEdgeIDs = Object.entries(model.silhouetteEdges).filter(([, edge]) => edge.vertices.some(id => ids.includes(id))).map(([id]) => id);
    const weightEdits = Object.entries(model.boneWeights).map(([boneWeightID, weight]) => ({
      model, path: `boneWeights.${boneWeightID}.weights`,
      value: Object.fromEntries(Object.entries(weight.weights).filter(([id]) => !ids.includes(id))),
    }));
    const recorder = manager.setCommandRecorder("Delete vertices");
    if (!recorder) return;
    for (const id of ids) {
      recorder.setCommand(RemoveValueCommand, { model, path: "vertices", removeKey: id });
      if (!recorder.command) { manager.cancelCommandRecorder(); return; }
      recorder.commitCommand();
    }
    for (const id of edgeIDs) {
      recorder.setCommand(RemoveValueCommand, { model, path: "edges", removeKey: id });
      if (!recorder.command) { manager.cancelCommandRecorder(); return; }
      recorder.commitCommand();
    }
    for (const id of silhouetteEdgeIDs) {
      recorder.setCommand(RemoveValueCommand, { model, path: "silhouetteEdges", removeKey: id });
      if (!recorder.command) { manager.cancelCommandRecorder(); return; }
      recorder.commitCommand();
    }
    recorder.setCommand(SetPropertiesCommand, { edits: [
        ...weightEdits,
        { model: state, path: "selectedVertexIDs", value: [] },
        { model: state, path: "activeVertexID", value: "" },
      ] });
    if (!recorder.command) { manager.cancelCommandRecorder(); return; }
    recorder.commitCommand();
    manager.commitCommandRecorder();
  }
}

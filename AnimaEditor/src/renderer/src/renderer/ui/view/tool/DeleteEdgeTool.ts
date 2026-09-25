import type { AnimaEditor } from "../../../../editor/Editor";
import type { UIComponent_View } from "../View";
import { InputManager } from "../../../../manager/InputManager";
import { Tool } from "./Tool";
import { Model_Sprite } from "../../../../core/project/model/Sprite";
import { SpriteState } from "../../../../editor/editorState/state/States/Sprite";
import { CommandManager } from "../../../../manager/CommandManager";
import { RemoveValueCommand } from "../../../../editor/command/primitiveCommand/RemoveValue";
export class DeleteEdgeTool extends Tool {
  public override update(editor: AnimaEditor, _view: UIComponent_View): void {
    const model = editor.editorState.activeObject;
    if (!editor.getManager(InputManager)?.getKeyDown("Mouse0") || !(model instanceof Model_Sprite)) return;
    const state = editor.editorState.getModelStateByID(model.id);
    if (!(state instanceof SpriteState)) return;
    const edgeIDs = state.selectedEdgeIDs.filter(edgeID => Boolean(model.edges[edgeID]));
    if (!edgeIDs.length) return;
    const manager = editor.getManager(CommandManager);
    if (!manager || manager.commandRecorder) return;
    const recorder = manager.setCommandRecorder("Delete edges");
    if (!recorder) return;
    for (const edgeID of edgeIDs) {
      recorder.setCommand(RemoveValueCommand, { model, path: "edges", removeKey: edgeID });
      if (!recorder.command) { manager.cancelCommandRecorder(); return; }
      recorder.commitCommand();
    }
    manager.commitCommandRecorder();
  }
}

import type { AnimaEditor } from "../../../../editor/Editor";
import type { UIComponent_View } from "../View";
import type { InputManager } from "../../../../manager/InputManager";
import { Model_Sprite } from "../../../../core/project/model/Sprite";
import { SpriteState } from "../../../../editor/editorState/state/States/Sprite";
import type { CommandRecorder } from "../../../../manager/CommandManager";
import { RemoveValueCommand } from "../../../../editor/command/primitiveCommand/RemoveValue";
import { SelectionDragTool } from "./SelectionDragTool";
export class DeleteEdgeTool extends SelectionDragTool {
  public override readonly id = "DeleteEdge";
  public override readonly label = "辺削除";
  public override readonly icon = "removeEdge";
  protected start(editor: AnimaEditor, _view: UIComponent_View, recorder: CommandRecorder): void {
    const model = editor.editorState.activeObject;
    if (!(model instanceof Model_Sprite)) return;
    const state = editor.editorState.getModelStateByID(model.id);
    if (!(state instanceof SpriteState)) return;
    const edgeIDs = state.selectedEdgeIDs.filter(edgeID => Boolean(model.edges[edgeID]));
    if (!edgeIDs.length) return;
    for (const edgeID of edgeIDs) {
      recorder.setCommand(RemoveValueCommand, { model, path: "edges", removeKey: edgeID });
      if (!recorder.command) return;
      recorder.commitCommand();
    }
  }
  protected move(_editor: AnimaEditor, _view: UIComponent_View, _input: InputManager, _recorder: CommandRecorder): void {}
}

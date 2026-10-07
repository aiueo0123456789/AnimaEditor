import type { AnimaEditor } from "../../../../editor/Editor";
import type { UIComponent_View } from "../View";
import type { InputManager } from "../../../../manager/InputManager";
import { Model_Sprite } from "../../../../core/project/model/Sprite";
import { SpriteState } from "../../../../editor/editorState/state/States/Sprite";
import type { CommandRecorder } from "../../../../manager/CommandManager";
import { AddValueCommand } from "../../../../editor/command/primitiveCommand/AddValue";
import { SelectionDragTool } from "./SelectionDragTool";
export class AddEdgeTool extends SelectionDragTool {
  public override readonly id = "AddEdge";
  public override readonly label = "辺追加";
  public override readonly icon = "addEdge";
  protected start(editor: AnimaEditor, _view: UIComponent_View, recorder: CommandRecorder): void {
    const model = editor.editorState.activeObject;
    if (!(model instanceof Model_Sprite)) return;
    const state = editor.editorState.getModelStateByID(model.id);
    if (!(state instanceof SpriteState)) return;
    const ids = [...new Set(state.selectedVertexIDs)].filter(id => Boolean(model.vertices[id]));
    const existing = Object.values(model.edges);
    const additions: [string, ReturnType<typeof Model_Sprite.createEdge>][] = [];
    for (let i = 1; i < ids.length; i++) {
      const a = ids[i - 1], b = ids[i];
      if (![...existing, ...additions.map(([, edge]) => edge)].some(edge => edge.vertices.includes(a) && edge.vertices.includes(b)))
        additions.push([crypto.randomUUID(), Model_Sprite.createEdge({ vertices: [a, b] })]);
    }
    if (!additions.length) return;
    for (const [edgeID, edge] of additions) {
      recorder.setCommand(AddValueCommand, { model, path: "edges", newKey: edgeID, newValue: edge });
      if (!recorder.command) return;
      recorder.commitCommand();
    }
  }
  protected move(_editor: AnimaEditor, _view: UIComponent_View, _input: InputManager, _recorder: CommandRecorder): void {}
}

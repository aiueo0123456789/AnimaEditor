import type { AnimaEditor } from "../../../../editor/Editor";
import type { UIComponent_View } from "../View";
import { InputManager } from "../../../../manager/InputManager";
import { Tool } from "./Tool";
import { Model_Sprite } from "../../../../core/project/model/Sprite";
import { SpriteState } from "../../../../editor/editorState/state/States/Sprite";
import { CommandManager } from "../../../../manager/CommandManager";
import { AddValueCommand } from "../../../../editor/command/primitiveCommand/AddValue";
export class AddEdgeTool extends Tool {
  public override update(editor: AnimaEditor, _view: UIComponent_View): void {
    const model = editor.editorState.activeObject;
    if (!editor.getManager(InputManager)?.getKeyDown("Mouse0") || !(model instanceof Model_Sprite)) return;
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
    const manager = editor.getManager(CommandManager);
    if (!manager || manager.commandRecorder) return;
    const recorder = manager.setCommandRecorder("Add edges");
    if (!recorder) return;
    for (const [edgeID, edge] of additions) {
      recorder.setCommand(AddValueCommand, { model, path: "edges", newKey: edgeID, newValue: edge });
      if (!recorder.command) { manager.cancelCommandRecorder(); return; }
      recorder.commitCommand();
    }
    manager.commitCommandRecorder();
  }
}

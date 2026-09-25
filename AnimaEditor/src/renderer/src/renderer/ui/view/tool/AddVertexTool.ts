import type { AnimaEditor } from "../../../../editor/Editor";
import type { UIComponent_View } from "../View";
import { InputManager } from "../../../../manager/InputManager";
import { Tool } from "./Tool";
import { Model_Sprite } from "../../../../core/project/model/Sprite";
import { CommandManager } from "../../../../manager/CommandManager";
import { AddValueCommand } from "../../../../editor/command/primitiveCommand/AddValue";
export class AddVertexTool extends Tool {
  public override update(editor: AnimaEditor, view: UIComponent_View): void {
    const input = editor.getManager(InputManager), model = editor.editorState.activeObject;
    if (!input?.getKeyDown("Mouse0") || !(model instanceof Model_Sprite)) return;
    const manager = editor.getManager(CommandManager);
    if (!manager || manager.commandRecorder) return;
    const recorder = manager.setCommandRecorder("Add vertex");
    if (!recorder) return;
    const vertexID = crypto.randomUUID();
    recorder.setCommand(AddValueCommand, { model, path: "vertices", newKey: vertexID,
      newValue: Model_Sprite.createVertex({ co: view.clientToWorld(input.mousePosition) }) });
    if (recorder.command) { recorder.commitCommand(); manager.commitCommandRecorder(); }
    else manager.cancelCommandRecorder();
  }
}

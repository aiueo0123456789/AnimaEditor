import type { AnimaEditor } from "../../../../editor/Editor";
import { CommandManager, CommandRecorder } from "../../../../manager/CommandManager";
import { InputManager } from "../../../../manager/InputManager";
import type { UIComponent_View } from "../View";
import type { Vec2 } from "../../../../util/vecMath";
import { Tool } from "./Tool";

export abstract class DragTool extends Tool {
  protected recorder: CommandRecorder | null = null;
  protected origin: Vec2 = [0, 0];
  private manager: CommandManager | null = null;
  private model: unknown;
  private project: unknown;
  public override deactivate(): void {
    if (this.recorder && this.manager?.commandRecorder === this.recorder) this.manager.cancelCommandRecorder();
    this.recorder = null;
    this.manager = null;
  }
  public override update(editor: AnimaEditor, view: UIComponent_View): void {
    const input = editor.getManager(InputManager), manager = editor.getManager(CommandManager);
    if (!input || !manager) return;
    if (this.recorder && (manager.commandRecorder !== this.recorder || editor.project !== this.project || editor.editorState.activeObject !== this.model)) this.deactivate();
    if (input.getKeyDown("Escape")) { this.deactivate(); return; }
    if (input.getKeyDown("Mouse0") && !this.recorder && !manager.commandRecorder) {
      this.origin = [...view.clientToWorld(input.mousePosition)];
      this.manager = manager;
      this.model = editor.editorState.activeObject;
      this.project = editor.project;
      this.recorder = manager.setCommandRecorder(this.constructor.name);
      if (!this.recorder) return;
      this.start(editor, view, this.recorder);
      if (!this.recorder.command) { this.deactivate(); return; }
    }
    if (!this.recorder) return;
    this.move(editor, view, input, this.recorder);
    if (!this.recorder) return;
    if (input.getKeyUp("Mouse0") || !input.getKey("Mouse0")) {
      this.recorder.commitCommand();
      manager.commitCommandRecorder();
      this.recorder = null;
      this.manager = null;
    }
  }
  protected abstract start(editor: AnimaEditor, view: UIComponent_View, recorder: CommandRecorder): void;
  protected abstract move(editor: AnimaEditor, view: UIComponent_View, input: InputManager, recorder: CommandRecorder): void;
}

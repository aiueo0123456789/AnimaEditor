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
  private pending = false;
  private started = false;
  public override deactivate(): void {
    if (this.recorder && this.manager?.commandRecorder === this.recorder) this.manager.cancelCommandRecorder();
    this.recorder = null;
    this.manager = null;
    this.pending = false;
    this.started = false;
  }
  public override update(editor: AnimaEditor, view: UIComponent_View): void {
    const input = editor.getManager(InputManager), manager = editor.getManager(CommandManager);
    if (!input || !manager) return;
    if ((this.pending || this.recorder) && (editor.project !== this.project || editor.editorState.activeObject !== this.model)) this.deactivate();
    if (this.recorder && manager.commandRecorder !== this.recorder) this.deactivate();
    if (input.getKeyDown("Escape")) { this.deactivate(); return; }
    if (input.getKeyDown("Mouse0") && !this.pending && !this.recorder && !manager.commandRecorder) {
      this.origin = [...view.clientToWorld(input.mousePosition)];
      this.manager = manager;
      this.model = editor.editorState.activeObject;
      this.project = editor.project;
      this.pending = true;
      this.started = false;
      this.press(editor, view, input);
    }
    if (this.pending && !this.started && input.getKey("Mouse0") && this.shouldStart(input) && !manager.commandRecorder) {
      this.started = true;
      this.recorder = manager.setCommandRecorder(this.constructor.name);
      if (!this.recorder) return;
      this.start(editor, view, this.recorder);
      if (!this.recorder.command) {
        if (this.recorder.commands.length) manager.commitCommandRecorder();
        else manager.cancelCommandRecorder();
        this.recorder = null;
        this.manager = null;
      }
    }
    if (this.recorder) this.move(editor, view, input, this.recorder);
    if (!this.pending || (!input.getKeyUp("Mouse0") && input.getKey("Mouse0"))) return;
    if (this.recorder) {
      this.finish(editor, view, input, this.recorder);
      manager.commitCommandRecorder();
    } else if (!this.started && !manager.commandRecorder) {
      const recorder = manager.setCommandRecorder(this.constructor.name);
      if (recorder) {
        this.click(editor, view, input, recorder);
        if (recorder.command) recorder.commitCommand();
        if (recorder.commands.length) manager.commitCommandRecorder();
        else manager.cancelCommandRecorder();
      }
    }
    this.recorder = null;
    this.manager = null;
    this.pending = false;
    this.started = false;
  }
  protected press(_editor: AnimaEditor, _view: UIComponent_View, _input: InputManager): void {}
  protected shouldStart(_input: InputManager): boolean { return true; }
  protected click(_editor: AnimaEditor, _view: UIComponent_View, _input: InputManager, _recorder: CommandRecorder): void {}
  protected abstract start(editor: AnimaEditor, view: UIComponent_View, recorder: CommandRecorder): void;
  protected abstract move(editor: AnimaEditor, view: UIComponent_View, input: InputManager, recorder: CommandRecorder): void;
  protected finish(_editor: AnimaEditor, _view: UIComponent_View, _input: InputManager, recorder: CommandRecorder): void {
    recorder.commitCommand();
  }
}

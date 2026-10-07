import type { AnimaEditor } from "../../../../editor/Editor";
import { SetPropertiesCommand } from "../../../../editor/command/interactionCommand/SetPropertiesCommand";
import type { CommandRecorder } from "../../../../manager/CommandManager";
import type { InputManager } from "../../../../manager/InputManager";
import type { UIComponent_View } from "../View";
import { DragTool } from "./DragTool";
import { pointSelection } from "./PointSelection";

export abstract class SelectionDragTool extends DragTool {
  private additiveSelection = false;

  protected override press(_editor: AnimaEditor, _view: UIComponent_View, input: InputManager): void {
    this.additiveSelection = input.getKey("ShiftLeft") || input.getKey("ShiftRight");
  }

  protected override shouldStart(input: InputManager): boolean { return input.dragging; }

  protected override click(editor: AnimaEditor, view: UIComponent_View, _input: InputManager, recorder: CommandRecorder): void {
    const selection = pointSelection(editor, view, this.origin, this.additiveSelection);
    if (selection?.changed) recorder.setCommand(SetPropertiesCommand, { edits: selection.edits });
  }
}

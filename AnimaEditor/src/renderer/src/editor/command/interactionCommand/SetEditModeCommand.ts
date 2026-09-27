import type { AnimaEditor } from "../../Editor";
import { ViewEditModes } from "../../editorState/ViewEditModes";
import { CommandReturn } from "../primitiveCommand/PrimitiveCommand";
import { updatePreview } from "../updatePreview";
import { InteractionCommand } from "./InteractionCommand";

export interface SetEditModeCommandUpdate { editMode: ViewEditModes; }
export class SetEditModeCommand extends InteractionCommand {
  private before = ViewEditModes.OBJECT;
  private after: ViewEditModes;
  constructor(editor: AnimaEditor, data: { editMode: ViewEditModes }) {
    super(editor, data);
    this.after = data.editMode;
  }
  private available(mode: ViewEditModes): boolean {
    const state = this.editor.editorState;
    return (state.getModelStateByID(state.activeObject?.id ?? "")?.availableModes ?? [ViewEditModes.OBJECT]).includes(mode);
  }
  public begin(): CommandReturn {
    if (!this.available(this.after)) return CommandReturn.ERROR;
    this.before = this.editor.editorState.editMode;
    return this.redo();
  }
  public update(data: SetEditModeCommandUpdate): CommandReturn {
    if (!this.available(data.editMode)) return CommandReturn.ERROR;
    return updatePreview(this, () => { this.after = data.editMode; });
  }
  public redo(): CommandReturn {
    this.api.setProperty(this.editor.editorState, "editMode", this.after);
    return CommandReturn.FINISHED;
  }
  public undo(): CommandReturn {
    this.api.setProperty(this.editor.editorState, "editMode", this.before);
    return CommandReturn.FINISHED;
  }
  public cancel(): CommandReturn { return this.commited ? CommandReturn.ERROR : this.undo(); }
}

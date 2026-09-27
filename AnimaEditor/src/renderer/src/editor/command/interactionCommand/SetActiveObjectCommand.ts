import { updatePreview } from "../updatePreview";
import { Models } from "../../../core/project/Project";
import { AnimaEditor } from "../../Editor";
import { CommandReturn } from "../primitiveCommand/PrimitiveCommand";
import { InteractionCommand, InteractionCommandInput } from "./InteractionCommand";
import { ViewEditModes } from "../../editorState/ViewEditModes";

export interface SetActiveObjectCommandInput extends InteractionCommandInput {
  newActiveObject: Models | null
}

export type SetActiveObjectCommandUpdate = SetActiveObjectCommandInput;

export class SetActiveObjectCommand extends InteractionCommand {
  private newActiveObject: Models | null;
  private oldActiveObject: Models | null;
  private oldEditMode = ViewEditModes.OBJECT;
  constructor(editor: AnimaEditor, data: SetActiveObjectCommandInput) {
    super(editor, data);
    this.newActiveObject = data.newActiveObject;
    this.oldActiveObject = null;
  }

  public begin(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;
    this.oldActiveObject = this.api.getProperty(this.editor.editorState, "activeObject") as (Models | null);
    this.oldEditMode = this.editor.editorState.editMode;
    return this.redo();
  }

  public override update(data: SetActiveObjectCommandUpdate): CommandReturn {
    return updatePreview(this, () => { this.newActiveObject = data.newActiveObject; });
  }

  public override redo(): CommandReturn {
    this.api.setProperty(this.editor.editorState, "activeObject", this.newActiveObject);
    const available = this.editor.editorState.getModelStateByID(this.newActiveObject?.id ?? "")?.availableModes ?? [ViewEditModes.OBJECT];
    this.api.setProperty(this.editor.editorState, "editMode", available.includes(this.oldEditMode) ? this.oldEditMode : ViewEditModes.OBJECT);
    return CommandReturn.FINISHED;
  }

  public override cancel(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;
    return this.undo();
  }

  public override undo(): CommandReturn {
    this.api.setProperty(this.editor.editorState, "activeObject", this.oldActiveObject);
    this.api.setProperty(this.editor.editorState, "editMode", this.oldEditMode);
    return CommandReturn.FINISHED;
  }
}

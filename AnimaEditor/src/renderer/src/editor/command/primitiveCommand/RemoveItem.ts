import { EditorAPI } from "../../EditorAPI";
import { updatePreview } from "../updatePreview";
import { PrimitiveCommand, PrimitiveCommandInput, CommandReturn } from "./PrimitiveCommand";

export interface RemoveItemCommandInput extends PrimitiveCommandInput {
  removeIndex: number,
}

export interface RemoveItemCommandUpdate {
  removeIndex: number,
}

export class RemoveItemCommand extends PrimitiveCommand {
  private removeIndex: number;
  private removeItem: any;

  constructor(api: EditorAPI, data: RemoveItemCommandInput) {
    super(api, data);

    this.removeIndex = data.removeIndex;

    this.removeItem = null;
  }

  public override begin(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;

    const array = this.api.getProperty(this.model, this.path);
    if (!Array.isArray(array)) return CommandReturn.ERROR;
    if (!Number.isInteger(this.removeIndex) || this.removeIndex < 0 || this.removeIndex >= array.length) return CommandReturn.ERROR;

    this.removeItem = array[this.removeIndex];
    return this.redo();
  }

  public override update(data: RemoveItemCommandUpdate): CommandReturn {
    const array = this.api.getProperty(this.model, this.path);
    if (!Array.isArray(array) || !Number.isInteger(data.removeIndex) || data.removeIndex < 0 || data.removeIndex > array.length) return CommandReturn.ERROR;
    return updatePreview(this, () => {
      this.removeIndex = data.removeIndex;
      this.removeItem = array[this.removeIndex];
    });
  }

  public override cancel(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;
    return this.undo();
  }

  public override redo(): CommandReturn {
    this.api.deleteElementByIndex(this.model, this.path, this.removeIndex);
    return CommandReturn.FINISHED;
  }

  public override undo(): CommandReturn {
    this.api.insertElement(this.model, this.path, this.removeIndex, this.removeItem);
    return CommandReturn.FINISHED;
  }
}

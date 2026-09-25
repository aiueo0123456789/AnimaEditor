import { EditorAPI } from "../../EditorAPI";
import { updatePreview } from "../updatePreview";
import { PrimitiveCommand, PrimitiveCommandInput, CommandReturn } from "./PrimitiveCommand";


export interface InsertElementCommandInput extends PrimitiveCommandInput {
  insertIndex: number,
  newElement: unknown,
}
export interface InsertElementCommandUpdate {
  insertIndex: number;
  newElement: unknown;
}

export class InsertElementCommand extends PrimitiveCommand {
  private insertIndex: number;
  private newElement: unknown;

  constructor(api: EditorAPI, data: InsertElementCommandInput) {
    super(api, data);

    this.insertIndex = data.insertIndex;
    this.newElement = data.newElement;
  }

  public override begin(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;

    const array = this.api.getProperty(this.model, this.path);
    if (!Array.isArray(array)) return CommandReturn.ERROR;
    if (!Number.isInteger(this.insertIndex) || this.insertIndex < 0 || this.insertIndex > array.length) return CommandReturn.ERROR;

    return this.redo();
  }

  public override update(data: InsertElementCommandUpdate): CommandReturn {
    const array = this.api.getProperty(this.model, this.path);
    if (!Array.isArray(array) || !Number.isInteger(data.insertIndex) || data.insertIndex < 0 || data.insertIndex >= array.length) return CommandReturn.ERROR;
    return updatePreview(this, () => {
      this.insertIndex = data.insertIndex;
      this.newElement = data.newElement;
    });
  }

  public override redo(): CommandReturn {
    this.api.insertElement(this.model, this.path, this.insertIndex, this.newElement);
    return CommandReturn.FINISHED;
  }

  public override cancel(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;
    return this.undo();
  }

  public override undo(): CommandReturn {
    this.api.deleteElementByIndex(this.model, this.path, this.insertIndex);
    return CommandReturn.FINISHED;
  }
}

import { EditorAPI } from "../../EditorAPI";
import { updatePreview } from "../updatePreview";
import { PrimitiveCommand, PrimitiveCommandInput, CommandReturn } from "./PrimitiveCommand";

export interface RemoveItemsCommandInput extends PrimitiveCommandInput {
  removeIndices: number[],
}
export interface RemoveItemsCommandUpdate { removeIndices: number[]; }

export class RemoveItemsCommand extends PrimitiveCommand {
  private sortedRemoveIndices: number[];
  private removeItems: any[];

  constructor(api: EditorAPI, data: RemoveItemsCommandInput) {
    super(api, data);

    this.sortedRemoveIndices = [...new Set(data.removeIndices)].sort((a, b) => a - b);

    this.removeItems = [];
  }

  public override begin(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;

    const array = this.api.getProperty(this.model, this.path);
    if (!Array.isArray(array)) return CommandReturn.ERROR;
    if (this.sortedRemoveIndices.some(index => !Number.isInteger(index) || index < 0 || index >= array.length)) return CommandReturn.ERROR;

    for (const removeIndex of this.sortedRemoveIndices) {
      this.removeItems.push(array[removeIndex]);
    }
    return this.redo();
  }

  public override update(data: RemoveItemsCommandUpdate): CommandReturn {
    const array = this.api.getProperty(this.model, this.path);
    if (!Array.isArray(array)) return CommandReturn.ERROR;
    const indices = [...new Set(data.removeIndices)].sort((a, b) => a - b);
    const originalLength = array.length + this.sortedRemoveIndices.length;
    if (indices.some(index => !Number.isInteger(index) || index < 0 || index >= originalLength)) return CommandReturn.ERROR;
    return updatePreview(this, () => {
      this.sortedRemoveIndices = indices;
      this.removeItems = indices.map(index => array[index]);
    });
  }

  public override redo(): CommandReturn {
    for (const removeIndex of [...this.sortedRemoveIndices].reverse()) {
      this.api.deleteElementByIndex(this.model, this.path, removeIndex);
    }
    return CommandReturn.FINISHED;
  }

  public override cancel(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;
    return this.undo();
  }

  public override undo(): CommandReturn {
    for (let i = 0; i < this.sortedRemoveIndices.length; i ++) {
      const removeIndex = this.sortedRemoveIndices[i];
      const removeItem = this.removeItems[i];
      this.api.insertElement(this.model, this.path, removeIndex, removeItem);
    }
    return CommandReturn.FINISHED;
  }
}

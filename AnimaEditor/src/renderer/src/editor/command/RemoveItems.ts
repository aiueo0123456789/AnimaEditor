import { EditorAPI } from "../EditorAPI";
import { Command, CommandReturn } from "./Command";

export interface RemoveItemsCommandInput {
  model: unknown,
  path: string,
  removeIndices: number[],
}

export class RemoveItemsCommand extends Command {
  private model: any;
  private path: string;
  private sortedRemoveIndices: number[];
  private removeItems: any[];

  constructor(api: EditorAPI) {
    super(api);

    this.model = null;
    this.path = "";
    this.sortedRemoveIndices = [];

    this.removeItems = [];
  }

  public override set(data: RemoveItemsCommandInput): CommandReturn {
    if (this.isStop()) return CommandReturn.ERROR;
    this.model = data.model;
    this.path = data.path;

    const array = this.api.getProperty(this.model, this.path);
    if (!Array.isArray(array)) return CommandReturn.ERROR;

    this.sortedRemoveIndices = data.removeIndices.sort((a) => a - a); // 昇順にソート
    for (const removeIndex of this.sortedRemoveIndices) {
      this.removeItems.push(array[removeIndex]);
    }
    return CommandReturn.FINISHED;
  }

  public override update(): CommandReturn {
    console.warn("このコマンドにupdateはありません");
    return CommandReturn.CANCELLED;
  }

  public override execute(): CommandReturn {
    for (const removeIndex of this.sortedRemoveIndices.reverse()) {
      this.api.deleteElementByIndex(this.model, this.path, removeIndex);
    }
    return CommandReturn.FINISHED;
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

import { EditorAPI } from "../EditorAPI";
import { Command, CommandReturn } from "./Command";

export interface RemoveItemCommandInput {
  model: unknown,
  path: string,
  removeIndex: number,
}

export class RemoveItemCommand extends Command {
  private model: any;
  private path: string;
  private removeIndex: number;
  private removeItem: any;

  constructor(api: EditorAPI) {
    super(api);

    this.model = null;
    this.path = "";
    this.removeIndex = 0;

    this.removeItem = null;
  }

  public override set(data: RemoveItemCommandInput): CommandReturn {
    if (this.isStop()) return CommandReturn.ERROR;
    this.model = data.model;
    this.path = data.path;

    const array = this.api.getProperty(this.model, this.path);
    if (!Array.isArray(array)) return CommandReturn.ERROR;

    this.removeIndex = data.removeIndex;
    this.removeItem = array[this.removeIndex];
    return CommandReturn.FINISHED;
  }

  public override update(): CommandReturn {
    console.warn("このコマンドにupdateはありません");
    return CommandReturn.CANCELLED;
  }

  public override execute(): CommandReturn {
    this.api.deleteElementByIndex(this.model, this.path, this.removeIndex);
    return CommandReturn.FINISHED;
  }

  public override undo(): CommandReturn {
    this.api.insertElement(this.model, this.path, this.removeIndex, this.removeItem);
    return CommandReturn.FINISHED;
  }
}

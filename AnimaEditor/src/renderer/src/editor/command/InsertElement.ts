import { EditorAPI } from "../EditorAPI";
import { Command, CommandReturn } from "./Command";


export interface InsertElementCommandInput {
  model: unknown,
  path: string,
  insertIndex: number,
  newElement: unknown,
}

export class InsertElementCommand extends Command {
  private model: unknown;
  private path: string;
  private insertIndex: number;
  private newElement: unknown;

  constructor(api: EditorAPI) {
    super(api);

    this.model = null;
    this.path = "";

    this.insertIndex = 0;
    this.newElement = null;

  }

  public override set(data: InsertElementCommandInput): CommandReturn {
    if (this.isStop()) return CommandReturn.ERROR;
    this.model = data.model;
    this.path = data.path;

    const array = this.api.getProperty(this.model, this.path);
    if (!Array.isArray(array)) return CommandReturn.ERROR;

    this.insertIndex = data.insertIndex;
    this.newElement = data.newElement;
    return CommandReturn.FINISHED;
  }

  public override update(): CommandReturn {
    console.warn("このコマンドにupdateはありません");
    return CommandReturn.CANCELLED;
  }

  public override execute(): CommandReturn {
    this.api.insertElement(this.model, this.path, this.insertIndex, this.newElement);
    return CommandReturn.FINISHED;
  }

  public override undo(): CommandReturn {
    this.api.deleteElementByIndex(this.model, this.path, this.insertIndex);
    return CommandReturn.FINISHED;
  }
}

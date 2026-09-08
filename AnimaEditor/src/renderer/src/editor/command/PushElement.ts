import { EditorAPI } from "../EditorAPI";
import { Command, CommandReturn } from "./Command";

export interface PushElementCommandInput {
  model: unknown,
  path: string,
  newElement: unknown,
}

export class PushElementCommand extends Command {
  private model: any;
  private path: string;
  private newElement: any;

  constructor(api: EditorAPI) {
    super(api);

    this.model = null;
    this.path = "";

    this.newElement = null;
  }

  public override set(data: PushElementCommandInput): CommandReturn {
    if (this.isStop()) return CommandReturn.ERROR;
    this.model = data.model;
    this.path = data.path;

    if (!Array.isArray(this.api.getProperty(this.model, this.path))) return CommandReturn.ERROR;

    this.newElement = data.newElement;
    return CommandReturn.FINISHED;
  }

  public override update(): CommandReturn {
    console.warn("このコマンドにupdateはありません");
    return CommandReturn.CANCELLED;
  }

  public override execute(): CommandReturn {
    this.api.pushElement(this.model, this.path, this.newElement);
    return CommandReturn.FINISHED;
  }

  public override undo(): CommandReturn {
    this.api.deleteLastElement(this.model, this.path);
    return CommandReturn.FINISHED;
  }
}

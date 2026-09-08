import { EditorAPI } from "../EditorAPI";
import { Command, CommandReturn } from "./Command";

export interface ClearCommandInput {
  model: unknown,
  path: string
}

export class ClearCommand extends Command {
  private model: any;
  private path: string;
  private oldElements: any[];

  constructor(api: EditorAPI) {
    super(api);

    this.model = null;
    this.path = "";
    this.oldElements = [];
  }

  public override set(data: ClearCommandInput): CommandReturn {
    if (this.isStop()) return CommandReturn.ERROR;
    this.model = data.model;
    this.path = data.path;

    const propertyValue = this.api.getProperty(this.model, this.path);
    if (!Array.isArray(propertyValue)) return CommandReturn.ERROR;

    for (const element of propertyValue) {
      this.oldElements.push(element);
    }
    return CommandReturn.FINISHED;
  }

  public override update(): CommandReturn {
    console.warn("このコマンドにupdateはありません");
    return CommandReturn.CANCELLED;
  }

  public override execute(): CommandReturn {
    this.api.clearElements(this.model, this.path);
    return CommandReturn.FINISHED;
  }

  public override undo(): CommandReturn {
    this.api.setElements(this.model, this.path, this.oldElements);
    return CommandReturn.FINISHED;
  }
}

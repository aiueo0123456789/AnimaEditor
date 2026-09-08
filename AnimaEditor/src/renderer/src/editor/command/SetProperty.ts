import { EditorAPI } from "../EditorAPI";
import { Command, CommandReturn } from "./Command";

export interface SetPropertyCommandInput {
  model: unknown,
  path: string,
  newValue: unknown,
}

export interface SetPropertyCommandUpdate {
  newValue: unknown,
}

export class SetPropertyCommand extends Command {
  private model: unknown;
  private path: string;
  private oldValue: unknown;
  private newValue: unknown;

  constructor(api: EditorAPI) {
    super(api);
    this.model = null;
    this.path = "";
    this.newValue = null;

    this.oldValue = null;
  }

  public override set(data: SetPropertyCommandInput): CommandReturn {
    if (this.isStop()) return CommandReturn.ERROR;
    this.model = data.model;
    this.path = data.path;

    this.oldValue = this.api.getProperty(this.model, this.path);

    this.newValue = data.newValue;
    return CommandReturn.FINISHED;
  }

  public override update(data: SetPropertyCommandUpdate): CommandReturn {
    if (this.isStop()) return CommandReturn.ERROR;
    this.newValue = data.newValue;
    return this.execute();
  }

  public override execute(): CommandReturn {
    if (!this.model) return CommandReturn.ERROR;
    if (this.oldValue === this.newValue) return CommandReturn.CANCELLED;
    this.api.setProperty(this.model, this.path, this.newValue);
    return CommandReturn.FINISHED;
  }

  public override undo() {
    if (!this.model) return CommandReturn.ERROR;
    this.api.setProperty(this.model, this.path, this.oldValue);
    return CommandReturn.FINISHED;
  }
}

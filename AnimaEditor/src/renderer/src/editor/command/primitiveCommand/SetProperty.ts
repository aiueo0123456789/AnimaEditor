import { EditorAPI } from "../../EditorAPI";
import { updatePreview } from "../updatePreview";
import { PrimitiveCommand, PrimitiveCommandInput, CommandReturn } from "./PrimitiveCommand";

export interface SetPropertyCommandInput extends PrimitiveCommandInput {
  newValue: unknown,
}

export interface SetPropertyCommandUpdate {
  newValue: unknown,
}

export class SetPropertyCommand extends PrimitiveCommand {
  private oldValue: unknown;
  private newValue: unknown;

  constructor(api: EditorAPI, data: SetPropertyCommandInput) {
    super(api, data);
    this.newValue = data.newValue;

    this.oldValue = null;
  }

  public override begin(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;

    this.oldValue = this.api.getProperty(this.model, this.path);

    return this.redo();
  }

  public override update(data: SetPropertyCommandUpdate): CommandReturn {
    return updatePreview(this, () => { this.newValue = data.newValue; });
  }

  public override redo(): CommandReturn {
    if (!this.model) return CommandReturn.ERROR;
    if (this.api.getProperty(this.model, this.path) === this.newValue) return CommandReturn.CANCELLED;
    this.api.setProperty(this.model, this.path, this.newValue);
    return CommandReturn.FINISHED;
  }

  public override cancel(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;
    return this.undo();
  }

  public override undo() {
    if (!this.model) return CommandReturn.ERROR;
    this.api.setProperty(this.model, this.path, this.oldValue);
    return CommandReturn.FINISHED;
  }
}

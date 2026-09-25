import { EditorAPI } from "../../EditorAPI";
import { updatePreview } from "../updatePreview";
import { PrimitiveCommand, PrimitiveCommandInput, CommandReturn } from "./PrimitiveCommand";

export interface AddValueCommandInput extends PrimitiveCommandInput {
  newKey: string,
  newValue: unknown,
}

export interface AddValueCommandUpdate {
  newKey: string,
  newValue: unknown,
}

export class AddValueCommand extends PrimitiveCommand {
  private newKey: string;
  private newValue: unknown;

  constructor(api: EditorAPI, data: AddValueCommandInput) {
    super(api, data);

    this.newKey = data.newKey;
    this.newValue = data.newValue;
  }

  public override begin(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;

    const dictionary = this.api.getProperty(this.model, this.path);
    if (!dictionary || typeof dictionary !== "object" || Array.isArray(dictionary) ||
        Object.prototype.hasOwnProperty.call(dictionary, this.newKey)) return CommandReturn.ERROR;

    return this.redo();
  }

  public override update(data: AddValueCommandUpdate): CommandReturn {
    return updatePreview(this, () => { this.newKey = data.newKey; this.newValue = data.newValue; });
  }

  public override cancel(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;
    return this.undo();
  }

  public override redo(): CommandReturn {
    const dictionary = this.api.getProperty(this.model, this.path);
    if (!dictionary || typeof dictionary !== "object" || Array.isArray(dictionary) ||
        Object.prototype.hasOwnProperty.call(dictionary, this.newKey)) return CommandReturn.ERROR;
    this.api.addToDictionary(this.model, this.path, this.newKey, this.newValue);
    return CommandReturn.FINISHED;
  }

  public override undo(): CommandReturn {
    const dictionary = this.api.getProperty(this.model, this.path);
    if (!dictionary || typeof dictionary !== "object" || Array.isArray(dictionary)) return CommandReturn.ERROR;
    if (!Object.prototype.hasOwnProperty.call(dictionary, this.newKey)) return CommandReturn.CANCELLED;
    this.api.deleteInDictionary(this.model, this.path, this.newKey);
    return CommandReturn.FINISHED;
  }
}

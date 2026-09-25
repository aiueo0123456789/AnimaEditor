import { EditorAPI } from "../../EditorAPI";
import { updatePreview } from "../updatePreview";
import { PrimitiveCommand, PrimitiveCommandInput, CommandReturn } from "./PrimitiveCommand";

export interface RemoveValueCommandInput extends PrimitiveCommandInput {
  removeKey: string,
  removeValue?: unknown,
}

export interface RemoveValueCommandUpdate {
  removeKey: string,
  removeValue: unknown,
}

export class RemoveValueCommand extends PrimitiveCommand {
  private removeKey: string;
  private removeValue: unknown;

  constructor(api: EditorAPI, data: RemoveValueCommandInput) {
    super(api, data);

    this.removeKey = data.removeKey;
    this.removeValue = data.removeValue;
  }

  public override begin(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;

    const dictionary = this.api.getProperty(this.model, this.path);
    if (!dictionary || typeof dictionary !== "object" || Array.isArray(dictionary) ||
        !Object.prototype.hasOwnProperty.call(dictionary, this.removeKey)) return CommandReturn.ERROR;
    this.removeValue = (dictionary as Record<string, unknown>)[this.removeKey];

    return this.redo();
  }

  public override update(data: RemoveValueCommandUpdate): CommandReturn {
    return updatePreview(this, () => { this.removeKey = data.removeKey; this.removeValue = data.removeValue; });
  }

  public override cancel(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;
    return this.undo();
  }

  public override redo(): CommandReturn {
    const dictionary = this.api.getProperty(this.model, this.path);
    if (!dictionary || typeof dictionary !== "object" || Array.isArray(dictionary)) return CommandReturn.ERROR;
    if (!Object.prototype.hasOwnProperty.call(dictionary, this.removeKey)) return CommandReturn.CANCELLED;
    this.api.deleteInDictionary(this.model, this.path, this.removeKey);
    return CommandReturn.FINISHED;
  }

  public override undo(): CommandReturn {
    const dictionary = this.api.getProperty(this.model, this.path);
    if (!dictionary || typeof dictionary !== "object" || Array.isArray(dictionary) ||
        Object.prototype.hasOwnProperty.call(dictionary, this.removeKey)) return CommandReturn.ERROR;
    this.api.addToDictionary(this.model, this.path, this.removeKey, this.removeValue);
    return CommandReturn.FINISHED;
  }
}

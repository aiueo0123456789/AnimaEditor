import { EditorAPI } from "../../EditorAPI";
import { updatePreview } from "../updatePreview";
import { PrimitiveCommand, PrimitiveCommandInput, CommandReturn } from "./PrimitiveCommand";

export interface PushElementCommandInput extends PrimitiveCommandInput {
  newElement: unknown,
}

export interface PushElementCommandUpdate {
  newElement: unknown,
}

export class PushElementCommand extends PrimitiveCommand {
  private newElement: any;

  constructor(api: EditorAPI, data: PushElementCommandInput) {
    super(api, data);

    this.newElement = data.newElement;
  }

  public override begin(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;

    if (!Array.isArray(this.api.getProperty(this.model, this.path))) return CommandReturn.ERROR;

    return this.redo();
  }

  public override update(data: PushElementCommandUpdate): CommandReturn {
    return updatePreview(this, () => { this.newElement = data.newElement; });
  }

  public override cancel(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;
    return this.undo();
  }

  public override redo(): CommandReturn {
    this.api.pushElement(this.model, this.path, this.newElement);
    return CommandReturn.FINISHED;
  }

  public override undo(): CommandReturn {
    this.api.deleteLastElement(this.model, this.path);
    return CommandReturn.FINISHED;
  }
}

import { EditorAPI } from "../../EditorAPI";
import { updatePreview } from "../updatePreview";
import { PrimitiveCommand, PrimitiveCommandInput, CommandReturn } from "./PrimitiveCommand";

export interface ClearCommandInput extends PrimitiveCommandInput {}
export type ClearCommandUpdate = Record<string, never>;

export class ClearCommand extends PrimitiveCommand {
  private oldElements: any[];

  constructor(api: EditorAPI, data: ClearCommandInput) {
    super(api, data);
    this.oldElements = [];
  }

  public override begin(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;

    const propertyValue = this.api.getProperty(this.model, this.path);
    if (!Array.isArray(propertyValue)) return CommandReturn.ERROR;

    for (const element of propertyValue) {
      this.oldElements.push(element);
    }
    return this.redo();
  }

  public override update(_data: ClearCommandUpdate = {}): CommandReturn {
    return updatePreview(this, () => {});
  }

  public override redo(): CommandReturn {
    this.api.clearElements(this.model, this.path);
    return CommandReturn.FINISHED;
  }

  public override cancel(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;
    return this.undo();
  }

  public override undo(): CommandReturn {
    this.api.setElements(this.model, this.path, this.oldElements);
    return CommandReturn.FINISHED;
  }
}

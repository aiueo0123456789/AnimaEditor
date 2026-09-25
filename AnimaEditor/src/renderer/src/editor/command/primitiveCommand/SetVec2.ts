import { Vec2, Vec2Math } from "../../../util/vecMath";
import { EditorAPI } from "../../EditorAPI";
import { updatePreview } from "../updatePreview";
import { PrimitiveCommand, PrimitiveCommandInput, CommandReturn } from "./PrimitiveCommand";

export interface SetVec2CommandInput extends PrimitiveCommandInput {
  newVec: Vec2,
}

export interface SetVec2CommandUpdate {
  newVec: Vec2,
}

export class SetVec2Command extends PrimitiveCommand {
  private oldVec: Vec2;
  private newVec: Vec2;

  constructor(api: EditorAPI, data: SetVec2CommandInput) {
    super(api, data);

    this.newVec = Vec2Math.create();
    Vec2Math.copy(data.newVec, this.newVec);

    this.oldVec = Vec2Math.create();
  }

  public override begin(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;

    const oldVec = this.api.getProperty(this.model, this.path) as Vec2;
    if (!Array.isArray(oldVec) || oldVec.length !== 2) return CommandReturn.ERROR;
    Vec2Math.copy(oldVec, this.oldVec);
    return this.redo();
  }

  public override update(data: SetVec2CommandUpdate): CommandReturn {
    if (!Array.isArray(data.newVec) || data.newVec.length !== 2 || !data.newVec.every(Number.isFinite)) return CommandReturn.ERROR;
    const vec = Vec2Math.copy(data.newVec);
    return updatePreview(this, () => { Vec2Math.copy(vec, this.newVec); });
  }

  public override cancel(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;
    return this.undo();
  }

  public override redo(): CommandReturn {
    if (this.oldVec === this.newVec) return CommandReturn.CANCELLED;
    this.api.setPropertyVec2(this.model, this.path, this.newVec);
    return CommandReturn.FINISHED;
  }

  public override undo(): CommandReturn {
    this.api.setPropertyVec2(this.model, this.path, this.oldVec);
    return CommandReturn.FINISHED;
  }
}

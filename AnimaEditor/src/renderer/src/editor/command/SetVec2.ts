import { Vec2, Vec2Math } from "../../util/vecMath";
import { EditorAPI } from "../EditorAPI";
import { Command, CommandReturn } from "./Command";

export interface SetVec2CommandInput {
  model: unknown,
  path: string,
  newVec: Vec2,
}

export interface SetVec2CommandUpdate {
  newVec: Vec2,
}

export class SetVec2Command extends Command {
  private model: any;
  private path: string | number;
  private oldVec: Vec2;
  private newVec: Vec2;

  constructor(api: EditorAPI) {
    super(api);
    this.model = null;
    this.path = "";

    this.oldVec = Vec2Math.create();

    this.newVec = Vec2Math.create();
  }

  public override set(data: SetVec2CommandInput): CommandReturn {
    if (this.isStop()) return CommandReturn.ERROR;
    this.model = data.model;
    this.path = data.path;
    const oldVec = this.api.getProperty(this.model, this.path) as Vec2;
    if (!Array.isArray(oldVec)) return CommandReturn.ERROR;
    Vec2Math.copy(oldVec, this.oldVec);
    Vec2Math.copy(data.newVec, this.newVec);
    return CommandReturn.FINISHED;
  }

  public override update(data: SetVec2CommandUpdate): CommandReturn {
    if (this.isStop()) return CommandReturn.ERROR;
    Vec2Math.copy(data.newVec, this.newVec);
    return this.execute();
  }

  public override execute(): CommandReturn {
    if (this.oldVec === this.newVec) return CommandReturn.CANCELLED;
    Vec2Math.copy(this.newVec, this.model[this.path]);
    return CommandReturn.FINISHED;
  }

  public override undo(): CommandReturn {
    Vec2Math.copy(this.oldVec, this.model[this.path]);
    return CommandReturn.FINISHED;
  }
}

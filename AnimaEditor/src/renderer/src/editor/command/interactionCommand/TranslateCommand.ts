import { updatePreview } from "../updatePreview";
import { Vec2, Vec2Math } from "../../../util/vecMath";
import { AnimaEditor } from "../../Editor";
import { CommandReturn } from "../primitiveCommand/PrimitiveCommand";
import { InteractionCommand, InteractionCommandInput } from "./InteractionCommand";
import type { PropertyRoot } from "../PropertyRoot";

export interface TranslateTarget {
  model: PropertyRoot;
  path: string;
  resolvePath?: () => string;
}

export interface TranslateCommandInput extends InteractionCommandInput {
  targets: TranslateTarget[]
}

export interface TranslateCommandUpdate {
  movement: Vec2;
}

export class TranslateCommand extends InteractionCommand {
  private targets: TranslateTarget[];
  private oldVecs: Vec2[];
  private newVecs: Vec2[];
  constructor(editor: AnimaEditor, data: TranslateCommandInput) {
    super(editor, data);
    this.targets = data.targets.map(target => ({ ...target }));
    this.oldVecs = [];
    this.newVecs = [];
  }

  public begin(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;
    for (const target of this.targets) {
      const oldVec = this.api.getProperty(target.model, target.resolvePath?.() ?? target.path) as Vec2;
      if (!Array.isArray(oldVec) || oldVec.length !== 2) return CommandReturn.ERROR;
      this.oldVecs.push(Vec2Math.copy(oldVec));
      this.newVecs.push(Vec2Math.copy(oldVec));
    }
    return CommandReturn.FINISHED;
  }

  public override update(data: TranslateCommandUpdate): CommandReturn {
    if (!Array.isArray(data.movement) || data.movement.length !== 2 || !data.movement.every(Number.isFinite)) return CommandReturn.ERROR;
    const movement = Vec2Math.copy(data.movement);
    return updatePreview(this, () => {
      this.newVecs = this.oldVecs.map(oldVec => Vec2Math.add(oldVec, movement));
    });
  }

  public override redo(): CommandReturn {
    const paths = this.targets.map(target => target.resolvePath?.() ?? target.path);
    for (let i = 0; i < this.targets.length; i ++) {
      const target = this.targets[i];
      this.api.setPropertyVec2(target.model, paths[i], this.newVecs[i]);
    }
    return CommandReturn.FINISHED;
  }

  public override cancel(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;
    return this.undo();
  }

  public override undo(): CommandReturn {
    const paths = this.targets.map(target => target.resolvePath?.() ?? target.path);
    for (let i = 0; i < this.targets.length; i ++) {
      const target = this.targets[i];
      this.api.setPropertyVec2(target.model, paths[i], this.oldVecs[i]);
    }
    return CommandReturn.FINISHED;
  }
}

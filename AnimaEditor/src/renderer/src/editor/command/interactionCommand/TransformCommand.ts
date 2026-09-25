import type { AnimaEditor } from "../../Editor";
import type { Vec2 } from "../../../util/vecMath";
import { InteractionCommand } from "./InteractionCommand";
import type { TranslateTarget } from "./TranslateCommand";
import { CommandReturn } from "../primitiveCommand/PrimitiveCommand";
import { updatePreview } from "../updatePreview";

export interface TransformCommandInput { targets: TranslateTarget[]; pivot: Vec2; }
export interface TransformCommandUpdate { angle?: number; scale?: number; }
export class TransformCommand extends InteractionCommand {
  private before: Vec2[] = [];
  private after: Vec2[] = [];
  private targets: TranslateTarget[];
  private pivot: Vec2;
  constructor(editor: AnimaEditor, data: TransformCommandInput) {
    super(editor, data);
    this.targets = data.targets.map(target => ({ ...target }));
    this.pivot = [...data.pivot];
  }
  public begin(): CommandReturn {
    const values = this.targets.map(target => this.api.getProperty(target.model, target.resolvePath?.() ?? target.path));
    if (values.some(value => !Array.isArray(value) || value.length !== 2 || !value.every(Number.isFinite))) return CommandReturn.ERROR;
    this.before = values.map(value => [...value as Vec2]);
    this.after = this.before.map(value => [...value]);
    return CommandReturn.FINISHED;
  }
  public update(data: TransformCommandUpdate): CommandReturn {
    const angle = data.angle ?? 0, scale = data.scale ?? 1;
    if (!Number.isFinite(angle) || !Number.isFinite(scale)) return CommandReturn.ERROR;
    return updatePreview(this, () => {
      this.after = this.before.map(([x, y]) => {
        x -= this.pivot[0]; y -= this.pivot[1];
        return [this.pivot[0] + scale * (x * Math.cos(angle) - y * Math.sin(angle)),
          this.pivot[1] + scale * (x * Math.sin(angle) + y * Math.cos(angle))];
      });
    });
  }
  private apply(values: Vec2[]): CommandReturn {
    const paths = this.targets.map(target => target.resolvePath?.() ?? target.path);
    this.targets.forEach((target, index) => this.api.setPropertyVec2(target.model, paths[index], values[index]));
    return CommandReturn.FINISHED;
  }
  public redo(): CommandReturn { return this.apply(this.after); }
  public undo(): CommandReturn { return this.apply(this.before); }
  public cancel(): CommandReturn { return this.commited ? CommandReturn.ERROR : this.undo(); }
}

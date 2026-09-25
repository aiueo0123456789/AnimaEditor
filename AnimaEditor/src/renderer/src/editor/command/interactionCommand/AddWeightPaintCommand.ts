import { Model_Sprite } from "../../../core/project/model/Sprite";
import { AnimaEditor, ID } from "../../Editor";
import { CommandReturn } from "../primitiveCommand/PrimitiveCommand";
import { updatePreview } from "../updatePreview";
import { InteractionCommand, InteractionCommandInput } from "./InteractionCommand";

export interface AddBoneWeightPaintCommandInput extends InteractionCommandInput {
  model: Model_Sprite;
  bone: ID;
}
export interface AddBoneWeightPaintCommandUpdate {
  // Total brush deltas since begin, keyed by vertex ID.
  paintingWeights: Record<ID, number>;
}

export class AddBoneWeightPaintCommand extends InteractionCommand {
  private model: Model_Sprite;
  private boneWeightID: ID;
  private oldWeights: Record<ID, number> = {};
  private newWeights: Record<ID, number> = {};

  constructor(editor: AnimaEditor, data: AddBoneWeightPaintCommandInput) {
    super(editor, data);
    this.model = data.model;
    this.boneWeightID = data.bone;
  }

  public override begin(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;
    const weight = this.model.boneWeights[this.boneWeightID];
    if (!weight) return CommandReturn.ERROR;
    this.oldWeights = { ...weight.weights };
    this.newWeights = { ...weight.weights };
    return CommandReturn.FINISHED;
  }

  public override update(data: AddBoneWeightPaintCommandUpdate): CommandReturn {
    const vertices = new Set(Object.keys(this.model.vertices));
    const deltas = Object.entries(data.paintingWeights);
    if (deltas.some(([id, value]) => !vertices.has(id) || !Number.isFinite(value))) return CommandReturn.ERROR;
    return updatePreview(this, () => {
      this.newWeights = { ...this.oldWeights };
      for (const [id, delta] of deltas) {
        this.newWeights[id] = Math.max(0, Math.min(1, (this.oldWeights[id] ?? 0) + delta));
      }
    });
  }

  private apply(weights: Record<ID, number>): CommandReturn {
    if (!this.model.boneWeights[this.boneWeightID]) return CommandReturn.ERROR;
    this.api.setProperty(this.model, `boneWeights.${this.boneWeightID}.weights`, { ...weights });
    return CommandReturn.FINISHED;
  }

  public override redo(): CommandReturn { return this.apply(this.newWeights); }

  public override cancel(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;
    return this.undo();
  }

  public override undo(): CommandReturn { return this.apply(this.oldWeights); }
}

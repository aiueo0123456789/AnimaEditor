import { Model_Armature, Model_Bone } from "../../../core/project/model/Armature";
import { Vec2, Vec2Math } from "../../../util/vecMath";
import { AnimaEditor } from "../../Editor";
import { CommandReturn } from "../primitiveCommand/PrimitiveCommand";
import { updatePreview } from "../updatePreview";
import { InteractionCommand, InteractionCommandInput } from "./InteractionCommand";

export interface BoneExtrudeCommandInput extends InteractionCommandInput {
  model: Model_Armature;
  bone: string;
}
export interface BoneExtrudeCommandUpdate { movement: Vec2; }

export class BoneExtrudeCommand extends InteractionCommand {
  private model: Model_Armature;
  private parentID: string;
  private newBoneID: string | null = null;
  private newBone: Model_Bone | null = null;
  private origin: Vec2 = Vec2Math.create();
  private movement: Vec2 = Vec2Math.create();

  constructor(editor: AnimaEditor, data: BoneExtrudeCommandInput) {
    super(editor, data);
    this.model = data.model;
    this.parentID = data.bone;
  }

  public override begin(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;
    const parent = this.model.bones[this.parentID];
    if (!parent) return CommandReturn.ERROR;
    this.origin = Vec2Math.copy(parent.tail);
    this.newBone = Model_Armature.createBone({
      head: Vec2Math.copy(this.origin), tail: Vec2Math.copy(this.origin),
      name: parent.name,
      parentID: { aramatureID: this.model.id, boneID: this.parentID },
    });
    this.newBoneID = crypto.randomUUID();
    return this.redo();
  }

  public override update(data: BoneExtrudeCommandUpdate): CommandReturn {
    if (!Array.isArray(data.movement) || data.movement.length !== 2 || !data.movement.every(Number.isFinite)) return CommandReturn.ERROR;
    const movement = Vec2Math.copy(data.movement);
    return updatePreview(this, () => { this.movement = movement; });
  }

  public override redo(): CommandReturn {
    if (!this.newBone || !this.newBoneID) return CommandReturn.ERROR;
    Vec2Math.copy(this.origin, this.newBone.head);
    Vec2Math.copy(Vec2Math.add(this.origin, this.movement), this.newBone.tail);
    if (this.model.bones[this.newBoneID]) return CommandReturn.ERROR;
    this.api.addToDictionary(this.model, "bones", this.newBoneID, this.newBone);
    return CommandReturn.FINISHED;
  }

  public override cancel(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;
    return this.undo();
  }

  public override undo(): CommandReturn {
    if (!this.newBoneID) return CommandReturn.ERROR;
    if (!this.model.bones[this.newBoneID]) return CommandReturn.CANCELLED;
    this.api.deleteInDictionary(this.model, "bones", this.newBoneID);
    return CommandReturn.FINISHED;
  }
}


import { ID } from "../../../editor/Editor";
import { Vec2, Vec2Math } from "../../../util/vecMath";
import { Model, ModelInput } from "../Model";


export interface BoneReferenceInput {
  aramatureID: ID,
  boneID: ID
}
export type BoneID = ID;
export interface Model_BoneInput {
  head?: Vec2,
  tail?: Vec2,
  parentID?: BoneReferenceInput,
  name?: string,
};
export interface Model_ArmatureInput extends ModelInput {
  targetID?: number,
  path?: string,
  bones?: Record<BoneID, Model_BoneInput>,
};

export class BoneReference {
  public aramatureID: ID;
  public boneID: ID;
  constructor(data: BoneReferenceInput) {
    this.aramatureID = data.aramatureID;
    this.boneID = data.boneID;
  }
}

export class Model_Bone {
  public name: string;
  public head: Vec2;
  public tail: Vec2;
  public parentID: BoneReference | null;
  constructor(data: Model_BoneInput) {
    this.name = data.name ?? "名称未設定ボーン";
    this.head = data.head ?? Vec2Math.create();
    this.tail = data.tail ?? Vec2Math.create();

    this.parentID = data.parentID ? new BoneReference(data.parentID) : new BoneReference({aramatureID: "", boneID: ""});
  }
}

export class Model_Armature extends Model {
  public static createBone(data: Model_BoneInput): Model_Bone {
    return new Model_Bone(data);
  }

  public bones: Record<BoneID, Model_Bone>;
  constructor(data: Model_ArmatureInput) {
    super(data);

    this.bones = Object.fromEntries(
      Object.entries(data.bones ?? {}).map(([id, bone]) => [id, new Model_Bone(bone)]),
    );
  }
}

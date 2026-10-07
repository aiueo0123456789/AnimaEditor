
import { ID } from "../../../editor/Editor";
import { Color } from "../../../util/color";
import { Vec2 } from "../../../util/vecMath";
import { Model, ModelInput } from "../Model";
import { AnimationReference, type AnimationReferenceInput } from "./Animation";


export interface BoneReferenceInput {
  aramatureID: ID,
  boneID: ID
}

export interface Model_ArmatureInput extends ModelInput {
  animation?: AnimationReferenceInput,
  bones?: Record<ID, ConstructorParameters<typeof Bone>[0]>,
  groups?: Record<ID, ConstructorParameters<typeof BoneGroup>[0]>,
};

export class BoneReference {
  public aramatureID: ID;
  public boneID: ID;
  constructor(data: BoneReferenceInput) {
    this.aramatureID = data.aramatureID;
    this.boneID = data.boneID;
  }
}

class BoneGroup {
  public name: string;
  public color: Color;
  constructor(data: {name: string, color: Color}) {
    this.name = data.name;
    this.color = data.color;
  }
}

class Bone {
  public name: string;
  public head: Vec2;
  public tail: Vec2;
  public parentID: BoneReference;
  public groupID: ID;
  constructor(data: {
    name?: string,
    head: Vec2,
    tail: Vec2,
    parentID: BoneReferenceInput,
    groupID: ID,
  }) {
    this.name = data.name ?? "名称未設定ボーン";
    this.head = data.head;
    this.tail = data.tail;
    this.groupID = data.groupID;

    this.parentID = new BoneReference(data.parentID);
  }
}

export class Model_Armature extends Model {
  static BoneGroup = BoneGroup;
  static Bone = Bone;

  public static createBone(data: ConstructorParameters<typeof Bone>[0]): Bone {
    return new Bone(data);
  }

  public animation: AnimationReference;
  public bones: Record<ID, Bone>;
  public groups: Record<ID, BoneGroup>;
  constructor(data: Model_ArmatureInput) {
    super(data);

    this.groups = Object.fromEntries(Object.entries(data.groups ?? {}).map(([id, boneGroup]) => [id, new BoneGroup(boneGroup)]));
    this.animation = data.animation ? new AnimationReference(data.animation) : new AnimationReference({animationID: "", trackMap: {}});
    this.bones = Object.fromEntries(Object.entries(data.bones ?? {}).map(([id, bone]) => [id, new Bone(bone)]));
  }
}

export namespace Model_Armature {
  export type BoneGroup = InstanceType<typeof BoneGroup>;
  export type Bone = InstanceType<typeof Bone>;
}

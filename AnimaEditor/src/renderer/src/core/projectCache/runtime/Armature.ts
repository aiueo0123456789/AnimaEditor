
import { ID } from "../../../editor/Editor";
import { Mat3, Mat3Math, Vec2, Vec2Math } from "../../../util/vecMath";
import { BoneReference, Model_Armature, Model_Bone } from "../../project/model/Armature";
import { System_Runtime_ReferencesResolver } from "../../system/runtime/Runtime";
import { Runtime } from "../Runtime";


class Base {
  public position: Vec2;
  public scale: Vec2;
  public rotation: number;
  public length: number;
  public worldMatrix: Mat3;
  public inverWorldMatrix: Mat3;
  public localMatrix: Mat3;

  constructor() {
    this.position = Vec2Math.create();
    this.scale = Vec2Math.create();
    this.rotation = 0;
    this.length = 1;

    this.worldMatrix = Mat3Math.create();
    this.inverWorldMatrix = Mat3Math.create();
    this.localMatrix = Mat3Math.create();
  }
}

class Animation {
  public position: Vec2;
  public scale: Vec2;
  public rotation: number;
  public localMatrix: Mat3;

  constructor() {
    this.position = Vec2Math.create();
    this.scale = Vec2Math.create();
    this.rotation = 0;

    this.localMatrix = Mat3Math.create();
  }
}

class Pose {
  public position: Vec2;
  public scale: Vec2;
  public rotation: number;
  public worldMatrix: Mat3;
  public inverWorldMatrix: Mat3;
  public localMatrix: Mat3;

  constructor() {
    this.position = Vec2Math.create();
    this.scale = Vec2Math.create();
    this.rotation = 0;

    this.worldMatrix = Mat3Math.create();
    this.inverWorldMatrix = Mat3Math.create();
    this.localMatrix = Mat3Math.create();
  }
}

export class Runtime_Bone {
  public boneID: ID;
  public model: Model_Bone;
  public base: Base;
  public animation: Animation;
  public pose: Pose;
  public parent: Runtime_Bone | null;
  constructor(boneID: ID, model: Model_Bone) {
    this.boneID = boneID;
    this.model = model;

    this.base = new Base();
    this.animation = new Animation();
    this.pose = new Pose();

    this.parent = null;
  }

  get id(): ID {
    return this.boneID;
  }
}

export class Runtime_Armature extends Runtime<Model_Armature> {
  public static createBone(boneID: ID, bone: Model_Bone) {
    return new Runtime_Bone(boneID, bone);
  }

  public bones: Runtime_Bone[] = [];
  public boneIDMap: Map<ID, number> = new Map();
  public override model: Model_Armature;
  constructor(model: Model_Armature) {
    super(model);
    this.model = model;
  }

  getBoneByID(id: ID): Runtime_Bone | null {
    const index = this.boneIDMap.get(id);
    if (typeof index !== "number") return null;
    return this.bones[index];
  }

  resolveReferences(referencesResolver: System_Runtime_ReferencesResolver): void {
    Object.entries(this.model.bones).forEach(([boneID, modelBone]) => {
      const runtimeBoneIndex = this.boneIDMap.get(boneID);
      if (typeof runtimeBoneIndex !== "number") return ;
      const runtimeBone = this.bones[runtimeBoneIndex];
      runtimeBone.parent = referencesResolver.bone(modelBone.parentID);
    })
  }
}

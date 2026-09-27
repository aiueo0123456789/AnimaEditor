
import { ID } from "../../../editor/Editor";
import { Mat3, Mat3Math, Vec2, Vec2Math } from "../../../util/vecMath";
import { Model_Armature } from "../../project/model/Armature";
import { Runtime_AnimationReference, System_Runtime_ReferencesResolver } from "../../system/runtime/Runtime";
import { Runtime } from "../Runtime";
import { Runtime_Animation } from "./Animation";


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
  public model: Model_Armature.Bone;
  public base: Base;
  public animation: Animation;
  public pose: Pose;
  public parent: Runtime_Bone | null;
  constructor(boneID: ID, model: Model_Armature.Bone) {
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
  public static createBone(boneID: ID, bone: Model_Armature.Bone) {
    return new Runtime_Bone(boneID, bone);
  }

  public animation: Runtime_AnimationReference = new Runtime_AnimationReference(null, {});
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

  getAnimationTarget() {
    return Object.keys(this.model.bones).flatMap(id => ["position.0", "position.1", "rotation", "scale.0", "scale.1"].map(property => `bones.${id}.animation.${property}`));
  }

  private animationProperty(path: string): { bone: Runtime_Bone; get: () => number; set: (value: number) => void } | null {
    const parts = path.split(".");
    if (parts[0] !== "bones" || parts[2] !== "animation") return null;
    const bone = this.getBoneByID(parts[1]);
    if (!bone) return null;
    if (parts.length === 4 && parts[3] === "rotation") return { bone, get: () => bone.animation.rotation, set: value => { bone.animation.rotation = value; } };
    if (parts.length === 5 && (parts[3] === "position" || parts[3] === "scale") && (parts[4] === "0" || parts[4] === "1")) {
      const vector = bone.animation[parts[3]], index = Number(parts[4]);
      return { bone, get: () => vector[index], set: value => { vector[index] = value; } };
    }
    return null;
  }

  getAnimationValue(path: string): number | undefined {
    return this.animationProperty(path)?.get();
  }

  setAnimation(): void {
    for (const [path, track] of Object.entries(this.animation.trackMap)) {
      if (track?.value === undefined || !Number.isFinite(track.value)) continue;
      this.animationProperty(path)?.set(track.value);
    }
  }

  resolveReferences(referencesResolver: System_Runtime_ReferencesResolver): void {
    this.animation = referencesResolver.animation(this.model.animation);
    Object.entries(this.model.bones).forEach(([boneID, modelBone]) => {
      const runtimeBoneIndex = this.boneIDMap.get(boneID);
      if (typeof runtimeBoneIndex !== "number") return ;
      const runtimeBone = this.bones[runtimeBoneIndex];
      runtimeBone.parent = referencesResolver.bone(modelBone.parentID);
    })
  }
}

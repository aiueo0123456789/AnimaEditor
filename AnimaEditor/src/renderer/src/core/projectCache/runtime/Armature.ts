
import { ID } from "../../../editor/Editor";
import { Mat3, Mat3Math, Vec2, Vec2Math } from "../../../util/vecMath";
import { Model_Armature, Model_Bone } from "../../project/model/Armature";
import { ReferenceResolver, Runtime } from "../Runtime";


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
  public model: Model_Bone;
  public base: Base;
  public animation: Animation;
  public pose: Pose;
  public parent: Runtime_Bone | null;
  constructor(model: Model_Bone) {
    this.model = model;

    this.base = new Base();
    this.animation = new Animation();
    this.pose = new Pose();

    this.parent = null;
  }

  get id(): ID {
    return this.model.id;
  }
}

export class Runtime_Armature extends Runtime {
  public static createBone(bone: Model_Bone) {
    return new Runtime_Bone(bone);
  }

  static referenceResolver = {
    bones: {
      [ReferenceResolver.PATH.ARRAY]: {
        parent: new ReferenceResolver("parentID"),
      },
    },
  };


  public bones: Runtime_Bone[];
  public override model: Model_Armature;
  constructor(model: Model_Armature) {
    super(model);
    this.model = model;

    this.bones = [];
  }

  getBoneByID(id: ID): Runtime_Bone | null {
    for (const bone of this.bones) {
      if (bone.id === id) return bone;
    }
    return null;
  }
}

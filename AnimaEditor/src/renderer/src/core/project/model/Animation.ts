import { ID } from "../../../editor/Editor";
import { Model, ModelInput, ModelReference, ModelReferenceInput } from "../Model";
import { BoneReference, BoneReferenceInput } from "./Armature";

export enum KeyframeInterpolation {
  LINEAR = 0,
}

interface KeyframeInput {
  id?: ID,
  frame?: number,
  value?: number,
  interpolation?: KeyframeInterpolation
};

export interface Model_AnimationInput extends ModelInput {
  targetID: ModelReferenceInput | BoneReferenceInput,
  path?: string,
  keyframes?: KeyframeInput[],
};

class Keyframe {
  public id: ID;
  public frame: number;
  public value: number;
  public interpolation: KeyframeInterpolation;
  constructor(data: KeyframeInput) {
    this.id = data.id ?? crypto.randomUUID();
    this.frame = data.frame ?? 0;
    this.value = data.value ?? 0;
    this.interpolation = data.interpolation ?? KeyframeInterpolation.LINEAR;
  }
}

export class Model_Animation extends Model {
  static createKeyframe(data: KeyframeInput): Keyframe {
    return new Keyframe(data);
  }

  public targetID: ModelReference | BoneReference;
  public path: string;
  public keyframes: Keyframe[];
  constructor(data: Model_AnimationInput) {
    super(data);

    this.targetID = data.targetID.modelID ? new ModelReference(data.targetID) : new BoneReference(data.targetID);
    this.path = data.path ?? "";
    this.keyframes = data.keyframes ? data.keyframes.map((keyframe) => new Keyframe(keyframe)) : [];
  }
}

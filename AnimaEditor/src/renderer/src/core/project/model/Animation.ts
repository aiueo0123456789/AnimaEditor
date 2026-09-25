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

interface Model_AnimationTrackInput {
  keyframes?: KeyframeInput[],
  path?: string,
}

export interface Model_AnimationInput extends ModelInput {
  targetID: ModelReferenceInput | BoneReferenceInput,
  tracks: Record<ID, Model_AnimationTrackInput>,
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

export class Model_AnimationTrack {
  public path: string;
  public keyframes: Keyframe[];
  constructor(data: Model_AnimationTrackInput) {
    this.keyframes = data.keyframes ? data.keyframes.map((keyframe) => new Keyframe(keyframe)) : [];
    this.path = data.path ?? "";
  }
}

export class Model_Animation extends Model {
  static createKeyframe(data: KeyframeInput): Keyframe {
    return new Keyframe(data);
  }

  public targetID: ModelReference | BoneReference;
  public tracks: Record<ID, Model_AnimationTrack>;
  constructor(data: Model_AnimationInput) {
    super(data);

    this.targetID = "modelID" in data.targetID ? new ModelReference(data.targetID) : new BoneReference(data.targetID);
    this.tracks = Object.fromEntries(
      Object.entries(data.tracks ?? {}).map(([id, track]) => [id, new Model_AnimationTrack(track)]),
    );
  }

  get tracksNum() {
    return Object.keys(this.tracks).length;
  }
}

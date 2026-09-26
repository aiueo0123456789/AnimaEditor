import { ID } from "../../../editor/Editor";
import { Model, ModelInput, ModelReference, ModelReferenceInput } from "../Model";

export enum KeyframeInterpolation {
  LINEAR = 0,
}

interface KeyframeInput {
  id?: ID,
  frame?: number,
  value?: number,
  interpolation?: KeyframeInterpolation
};

interface TrackInput {
  name?: string
  path?: string,
  keyframes?: KeyframeInput[],
}

export interface Model_AnimationInput extends ModelInput {
  targetID: ModelReferenceInput,
  tracks: Record<ID, TrackInput>,
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

class Track {
  public name: string;
  public path: string;
  public keyframes: Keyframe[];
  constructor(data: TrackInput) {
    this.name = data.name ?? "名称未設定";
    this.path = data.path ?? "";
    this.keyframes = data.keyframes ? data.keyframes.map((keyframe) => new Keyframe(keyframe)) : [];
  }
}

export class Model_Animation extends Model {
  static Keyframe = Keyframe;
  static Track = Track;

  static createKeyframe(data: KeyframeInput): Keyframe {
    return new Keyframe(data);
  }

  public targetID: ModelReference;
  public tracks: Record<ID, Track>;
  constructor(data: Model_AnimationInput) {
    super(data);

    if (!data.targetID || typeof data.targetID.modelID !== "string") {
      throw new TypeError("Animation target must be a Model reference");
    }
    this.targetID = new ModelReference(data.targetID);
    this.tracks = Object.fromEntries(
      Object.entries(data.tracks ?? {}).map(([id, track]) => [id, new Track(track)]),
    );
  }

  get tracksNum() {
    return Object.keys(this.tracks).length;
  }
}

export namespace Model_Animation {
  export type Keyframe = InstanceType<typeof Keyframe>;
  export type Track = InstanceType<typeof Track>;
}

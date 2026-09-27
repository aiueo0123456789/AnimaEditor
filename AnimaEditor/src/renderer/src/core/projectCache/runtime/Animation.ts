import { Runtime } from "../Runtime";
import { KeyframeInterpolation, Model_Animation } from "../../project/model/Animation";
import { ID } from "../../../editor/Editor";
import { System_Runtime_ReferencesResolver } from "../../system/runtime/Runtime";

class Keyframe {
  public id: ID;
  public frame: number;
  public value: number;
  public interpolation: KeyframeInterpolation;
  constructor() {
    this.id = "";
    this.frame = 0;
    this.value = 0;
    this.interpolation = KeyframeInterpolation.LINEAR;
  }
}

class Track {
  public keyframes: Keyframe[] = [];
  public keyframeIDMap: Map<ID, number> = new Map();
  public value: number | undefined;
  constructor() {}
}

export class Runtime_Animation extends Runtime<Model_Animation> {
  static Keyframe = Keyframe;
  static Track = Track;

  static createKeyframe() {
    return new Keyframe();
  }

  static createTrack() {
    return new Track();
  }

  public tracks: Track[] = [];
  public trackIDMap: Map<ID, number> = new Map();

  constructor(model: Model_Animation) {
    super(model);
    this.model = model;
  }

  resolveReferences(_referencesResolver: System_Runtime_ReferencesResolver): void {}
}

export namespace Runtime_Animation {
  export type Keyframe = InstanceType<typeof Keyframe>;
  export type Track = InstanceType<typeof Track>;
}

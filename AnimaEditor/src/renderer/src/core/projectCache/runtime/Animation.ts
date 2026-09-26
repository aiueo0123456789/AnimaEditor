import { Runtime } from "../Runtime";
import { KeyframeInterpolation, Model_Animation } from "../../project/model/Animation";
import { ID } from "../../../editor/Editor";
import { System_Runtime_ReferencesResolver } from "../../system/runtime/Runtime";
import { ModelReference } from "../../project/Model";


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
  public path: string = "";
  public keyframes: Keyframe[] = [];
  public keyframeIDMap: Map<ID, number> = new Map();
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

  public target: object | null = null;
  public tracks: Track[] = [];
  public trackIDMap: Map<ID, number> = new Map();

  constructor(model: Model_Animation) {
    super(model);
    this.model = model;
  }

  resolveReferences(referencesResolver: System_Runtime_ReferencesResolver): void {
    if (this.model.targetID instanceof ModelReference) this.target = referencesResolver.model(this.model.targetID);
    else this.target = null;
  }
}

export namespace Runtime_Animation {
  export type Keyframe = InstanceType<typeof Keyframe>;
  export type Track = InstanceType<typeof Track>;
}

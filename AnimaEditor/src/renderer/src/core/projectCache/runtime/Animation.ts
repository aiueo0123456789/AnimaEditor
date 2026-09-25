import { ReferenceResolver, Runtime } from "../Runtime";
import { Model_Animation } from "../../project/model/Animation";
import { ID } from "../../../editor/Editor";


class Keyframe {
  public id: ID;
  public frame: number;
  public value: number;
  public interpolation: string;
  constructor() {
    this.id = "";
    this.frame = 0;
    this.value = 0;
    this.interpolation = "LINEAR";
  }
}

class Path {
  constructor() {
    
  }
}

export class Runtime_Animation extends Runtime<Model_Animation> {
  static override referenceResolver = {
    target: new ReferenceResolver("targetID"),
  };

  public target: any;
  public path: Path;
  public keyframes: Keyframe[];

  constructor(model: Model_Animation) {
    super(model);
    this.model = model;

    this.target = null;

    this.path = new Path();
    this.keyframes = [];
  }
}

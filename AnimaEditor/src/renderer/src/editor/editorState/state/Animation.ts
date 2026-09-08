import { Model_Animation } from "../../../core/project/model/Animation";
import { State } from "./State";

export class AnimationState extends State {
  public activeKeyframeIndex: number;
  public selectKeyframeIDs: number[];
  constructor(model: Model_Animation) {
    super(model);

    this.activeKeyframeIndex = -1;
    this.selectKeyframeIDs = [];
  }
}

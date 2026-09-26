import { Model_Animation } from "../../../../core/project/model/Animation";
import { State } from "../State";
import type { ID } from "../../../Editor";

export class AnimationState extends State<Model_Animation> {
  public activeTrackID: ID = "";
  public activeKeyframeID: ID = "";
  public selectKeyframeIDs: ID[] = [];

  constructor(model: Model_Animation) {
    super(model);
  }
}

import { Model_Sprite } from "../../../core/project/model/Sprite";
import { State } from "./State";

export class SpriteState extends State {
  public activeBoneWeightBoneID: string | null;
  public selectedVertexIndices: number[];
  public activeVertexIndex: number;

  constructor(model: Model_Sprite) {
    super(model);

    this.activeBoneWeightBoneID = null;
    this.selectedVertexIndices = [];
    this.activeVertexIndex = -1;
  }

  get selectedEdgeIndices(): number[] {
    const result: number[] = [];
    this.model.edges.forEach((edge, ei) => {
      if (this.selectedVertexIndices.includes(edge[0]) && this.selectedVertexIndices.includes(edge[1])) result.push(ei);
    })
    return result;
  }
}

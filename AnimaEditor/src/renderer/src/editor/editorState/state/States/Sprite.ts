import { Model_Sprite } from "../../../../core/project/model/Sprite";
import { ViewEditModes } from "../../../../renderer/ui/view/ViewEditModes";
import { ID } from "../../../Editor";
import { State } from "../State";

export class SpriteState extends State<Model_Sprite> {
  public activeBoneWeightID: ID = "";
  public selectedVertexIDs: ID[] = [];
  public activeVertexID: ID = "";
  public override availableModes: ViewEditModes[] = [ViewEditModes.OBJECT, ViewEditModes.VERTEX, ViewEditModes.WEIGHTPAINT];

  constructor(model: Model_Sprite) {
    super(model);
  }

  get selectedEdgeIDs(): ID[] {
    const result: ID[] = [];
    for (const [edgeID, edge] of Object.entries(this.model.edges)) {
      if (edge.vertices.every(id => this.selectedVertexIDs.includes(id))) result.push(edgeID);
    }
    return result;
  }
}

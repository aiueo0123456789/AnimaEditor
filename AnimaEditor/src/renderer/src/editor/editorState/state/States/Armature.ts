import { Model_Armature } from "../../../../core/project/model/Armature";
import { ID } from "../../../Editor";
import { ViewEditModes } from "../../ViewEditModes";
import { State } from "../State";

export class ArmatureState extends State<Model_Armature> {
  public activeGroupID: ID = "";
  public activeBoneID: ID = "";
  public selectedHeadIDs: ID[] = [];
  public selectedTailIDs: ID[] = [];
  public activeVertexID: ID = "";
  public override availableModes: ViewEditModes[] = [ViewEditModes.OBJECT, ViewEditModes.BONE, ViewEditModes.BONEANIMATION];

  constructor(model: Model_Armature) {
    super(model);
  }

  get selectedBoneIDs() {
    return this.selectedHeadIDs.filter(id => this.selectedTailIDs.includes(id));
  }

  public get selectedVertexNum() {
    const heads = new Set([...this.selectedHeadIDs, ...this.selectedBoneIDs]);
    const tails = new Set([...this.selectedTailIDs, ...this.selectedBoneIDs]);
    return Object.keys(this.model.bones).reduce((count, boneID) => count + Number(heads.has(boneID)) + Number(tails.has(boneID)), 0);
  }
}

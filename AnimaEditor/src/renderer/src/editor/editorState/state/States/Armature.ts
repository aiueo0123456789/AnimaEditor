import { BoneID, Model_Armature } from "../../../../core/project/model/Armature";
import { ViewEditModes } from "../../../../renderer/ui/view/ViewEditModes";
import { State } from "../State";

export type { BoneID };

export class ArmatureState extends State<Model_Armature> {
  // public selectedBoneIDs: BoneID[] = [];
  public selectedHeadIDs: BoneID[] = [];
  public selectedTailIDs: BoneID[] = [];
  public activeVertexID: BoneID = "";
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

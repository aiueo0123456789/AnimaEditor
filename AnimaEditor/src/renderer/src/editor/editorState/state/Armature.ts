import { Model_Armature } from "../../../core/project/model/Armature";
import { State } from "./State";

export type BoneID = string;

export class ArmatureState extends State {
  public selectedBone: number[];
  public selectedHead: number[];
  public selectedTail: number[];
  public activeVertexID: BoneID;

  constructor(model: Model_Armature) {
    super(model);

    this.selectedBone = [];
    this.selectedHead = [];
    this.selectedTail = [];
    this.activeVertexID = "";
  }

  public get selectedVertexNum() {
    return this.selectedHead.length + this.selectedTail.length;
  }
}

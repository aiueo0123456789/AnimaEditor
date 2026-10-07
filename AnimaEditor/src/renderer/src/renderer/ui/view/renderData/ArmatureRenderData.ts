import { Runtime_Armature } from "../../../../core/projectCache/runtime/Armature";
import { ArmatureState } from "../../../../editor/editorState/state/States/Armature";
import { simpleWebGPU } from "../../../../util/simpleWebGPU";
import { View_ModelRenderData } from "./ModelRenderData";
import { boneGeometry, type ViewGeometrySource } from "../ViewGeometry";

export class View_ArmatureRenderData extends View_ModelRenderData {
  public boneCount = 0;
  public selectedBoneCount = 0;
  public selectedVertexCount = 0;
  public boneBuffer = simpleWebGPU.createBuffer(32, ["V", "S"]);
  public selectBoneBuffer = simpleWebGPU.createBuffer(32, ["V", "S"]);
  public boneColorBuffer = simpleWebGPU.createBuffer(32, ["S"]);
  public selectBoneColorBuffer = simpleWebGPU.createBuffer(32, ["S"]);
  public boneVertexColorBuffer = simpleWebGPU.createBuffer(32, ["S"]);
  public selectBoneVertexColorBuffer = simpleWebGPU.createBuffer(32, ["S"]);
  public boneVertexBuffer = simpleWebGPU.createBuffer(32, ["V", "S"]);
  public selectBoneVertexBuffer = simpleWebGPU.createBuffer(32, ["V", "S"]);
  public vertexBuffer: GPUBuffer;
  public objectIDBuffer: GPUBuffer;

  constructor(numberID: number) {
    super(numberID);
    this.vertexBuffer = simpleWebGPU.createBuffer(40, ["V"], new Float32Array([0, 0, .1, .05, 1, 0, .1, -.05, 0, 0]));
    this.objectIDBuffer = simpleWebGPU.createBuffer(4, ["U"]);
  }

  private upload(buffer: GPUBuffer, values: number[]): GPUBuffer {
    const size = Math.max(32, values.length * 4);
    if (buffer.size !== size) {
      buffer.destroy();
      buffer = simpleWebGPU.createBuffer(size, ["V", "S"]);
    }
    if (values.length) simpleWebGPU.writeBuffer(buffer, new Float32Array(values));
    return buffer;
  }

  public update(armature: Runtime_Armature, state: ArmatureState, source: ViewGeometrySource = "runtime"): void {
    const bones = boneGeometry(armature, source);
    const selectedIDs = new Set(state.selectedBoneIDs);
    const selectedBones = bones.filter(bone => selectedIDs.has(bone.id));
    const heads = new Set([...state.selectedHeadIDs, ...selectedIDs]);
    const tails = new Set([...state.selectedTailIDs, ...selectedIDs]);
    const selectedVertices = bones.flatMap(bone => [
      ...(heads.has(bone.id) ? [bone.head] : []),
      ...(tails.has(bone.id) ? [bone.tail] : []),
    ]);
    this.boneCount = bones.length;
    this.selectedBoneCount = selectedBones.length;
    this.selectedVertexCount = selectedVertices.length;
    this.boneBuffer = this.upload(this.boneBuffer, bones.flatMap(bone => bone.packed));
    this.selectBoneBuffer = this.upload(this.selectBoneBuffer, selectedBones.flatMap(bone => bone.packed));
    const color = (id: string): number[] => {
      const group = armature.model.groups[armature.model.bones[id]?.groupID];
      const fallback = [1, 0, 0, 1];
      return fallback.map((value, index) => Number.isFinite(group?.color[index]) ? Math.max(0, Math.min(1, group.color[index])) : value);
    };
    this.boneColorBuffer = this.upload(this.boneColorBuffer, bones.flatMap(bone => color(bone.id)));
    const selectedColor = (id: string): number[] => color(id).map((value, index) => index < 3 ? value * 0.55 + 0.45 : Math.max(value, 0.6));
    this.selectBoneColorBuffer = this.upload(this.selectBoneColorBuffer, selectedBones.flatMap(bone => selectedColor(bone.id)));
    this.boneVertexColorBuffer = this.upload(this.boneVertexColorBuffer, bones.flatMap(bone => [...color(bone.id), ...color(bone.id)]));
    this.selectBoneVertexColorBuffer = this.upload(this.selectBoneVertexColorBuffer, bones.flatMap(bone => [
      ...(heads.has(bone.id) ? selectedColor(bone.id) : []),
      ...(tails.has(bone.id) ? selectedColor(bone.id) : []),
    ]));
    this.boneVertexBuffer = this.upload(this.boneVertexBuffer, bones.flatMap(bone => [...bone.head, ...bone.tail]));
    this.selectBoneVertexBuffer = this.upload(this.selectBoneVertexBuffer, selectedVertices.flat());
    simpleWebGPU.writeBuffer(this.objectIDBuffer, new Uint32Array([this.numberID]));
  }
}

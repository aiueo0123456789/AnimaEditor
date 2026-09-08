import { Runtime_Armature } from "../../../../core/projectCache/runtime/Armature";
import { ArmatureState } from "../../../../editor/editorState/state/Armature";
import { simpleWebGPU } from "../../../../util/simpleWebGPU";
import { View_ModelRenderData } from "./ModelRenderData";

export class View_ArmatureRenderData extends View_ModelRenderData {
  public boneBuffer: GPUBuffer | null;
  public boneVertexBuffer: GPUBuffer | null;
  public vertexBuffer: GPUBuffer;
  public objectIDBuffer: GPUBuffer;
  public selectBoneVertexBuffer: GPUBuffer | null;

  constructor(numberID: number) {
    super(numberID);
    this.boneBuffer = null;
    this.boneVertexBuffer = null;
    this.vertexBuffer = simpleWebGPU.createBuffer(5 * 2 * 4, ["V"]);
    this.selectBoneVertexBuffer = null;
    this.objectIDBuffer = simpleWebGPU.createBuffer(4, ["U"]);
  }

  public update(armature: Runtime_Armature, armatureState: ArmatureState): void {
    // TSのコンパイルのために判定を分ける
    if (armature.bones.length === 0) return ;
    if (armature.bones.length * (2 + 2 + 1 + 1) * 4 !== this.boneBuffer?.size) this.boneBuffer = simpleWebGPU.createBuffer(armature.bones.length * (2 + 2 + 1 + 1) * 4, ["V", "S"]);
    if (armature.bones.length * (2 + 2) * 4 !== this.boneVertexBuffer?.size) this.boneVertexBuffer = simpleWebGPU.createBuffer(armature.bones.length * (2 + 2) * 4, ["V", "S"]);
    if (armatureState.selectedVertexNum * 2 * 4 !== this.selectBoneVertexBuffer?.size) this.selectBoneVertexBuffer = simpleWebGPU.createBuffer(armatureState.selectedVertexNum * 2 * 4, ["S"]);

    simpleWebGPU.writeBuffer(
      this.selectBoneVertexBuffer,
      new Float32Array(armatureState.selectedHead.map(bi => armature.model.bones[bi].head).concat(armatureState.selectedTail.map(bi => armature.model.bones[bi].tail)).flat())
    );
    simpleWebGPU.writeBuffer(
      this.objectIDBuffer,
      new Uint32Array([this.numberID])
    );
    simpleWebGPU.writeBuffer(
      this.boneVertexBuffer,
      new Float32Array(
        armature.model.bones.map((bone) => [...bone.head, ...bone.tail]).flat(),
      ),
    );
    simpleWebGPU.writeBuffer(
      this.boneBuffer,
      new Float32Array(
        armature.bones
          .map((bone) => [
            ...bone.pose.position,
            ...bone.pose.scale,
            bone.pose.rotation,
            bone.base.length,
          ])
          .flat(),
      ),
    );
    simpleWebGPU.writeBuffer(
      this.vertexBuffer,
      new Float32Array([
        0.0,
        0.0, // 根元
        0.1,
        0.05, // 上
        1.0,
        0.0, // 先端
        0.1,
        -0.05, // 下
        0.0,
        0.0, // 根元（閉じる）
      ]),
    );
  }
}
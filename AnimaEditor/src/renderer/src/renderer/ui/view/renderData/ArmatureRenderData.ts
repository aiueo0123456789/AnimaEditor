import { Runtime_Armature } from "../../../../core/projectCache/runtime/Armature";
import { ArmatureState } from "../../../../editor/editorState/state/States/Armature";
import { simpleWebGPU } from "../../../../util/simpleWebGPU";
import { View_ModelRenderData } from "./ModelRenderData";

export class View_ArmatureRenderData extends View_ModelRenderData {
  public selectedBoneCount = 0;
  public selectedVertexCount = 0;
  public boneBuffer: GPUBuffer = simpleWebGPU.createBuffer(32, ["V", "S"]);
  public selectBoneBuffer: GPUBuffer = simpleWebGPU.createBuffer(32, ["V", "S"]);
  public boneVertexBuffer: GPUBuffer = simpleWebGPU.createBuffer(32, ["V", "S"]);
  public vertexBuffer: GPUBuffer;
  public objectIDBuffer: GPUBuffer;
  public selectBoneVertexBuffer: GPUBuffer = simpleWebGPU.createBuffer(32, ["V", "S"]);

  constructor(numberID: number) {
    super(numberID);
    this.vertexBuffer = simpleWebGPU.createBuffer(5 * 2 * 4, ["V"]);
    this.objectIDBuffer = simpleWebGPU.createBuffer(4, ["U"]);
  }

  public update(armature: Runtime_Armature, armatureState: ArmatureState): void {
    const selectedBone = armature.bones.filter(bone => armatureState.selectedBoneIDs.includes(bone.id));
    const selectedVertices = ["head", "tail"].flatMap(part => {
      const ids = new Set(part === "head" ? armatureState.selectedHeadIDs : armatureState.selectedTailIDs);
      for (const id of armatureState.selectedBoneIDs) ids.add(id);
      return Object.entries(armature.model.bones).filter(([id]) => ids.has(id)).map(([, bone]) => part === "head" ? bone.head : bone.tail);
    });
    this.selectedBoneCount = selectedBone.length;
    this.selectedVertexCount = selectedVertices.length;
    // TSのコンパイルのために判定を分ける
    if (Math.max(32, armature.bones.length * (2 + 2 + 1 + 1) * 4) !== this.boneBuffer.size) {
      this.boneBuffer.destroy();
      this.boneBuffer = simpleWebGPU.createBuffer(Math.max(32, armature.bones.length * (2 + 2 + 1 + 1) * 4), ["V", "S"]);
    }
    if (Math.max(32, this.selectedBoneCount * (2 + 2 + 1 + 1) * 4) !== this.selectBoneVertexBuffer.size) {
      this.selectBoneBuffer.destroy();
      this.selectBoneBuffer = simpleWebGPU.createBuffer(Math.max(32, this.selectedBoneCount * (2 + 2 + 1 + 1) * 4), ["V", "S"]);
    }
    if (Math.max(32, armature.bones.length * (2 + 2) * 4) !== this.boneVertexBuffer.size) {
      this.boneVertexBuffer.destroy();
      this.boneVertexBuffer = simpleWebGPU.createBuffer(Math.max(32, armature.bones.length * (2 + 2) * 4), ["V", "S"]);
    }
    if (Math.max(32, this.selectedVertexCount * 2 * 4) !== this.selectBoneVertexBuffer.size) {
      this.selectBoneVertexBuffer.destroy();
      this.selectBoneVertexBuffer = simpleWebGPU.createBuffer(Math.max(32, this.selectedVertexCount * 2 * 4), ["S"]);
    }

    simpleWebGPU.writeBuffer(
      this.selectBoneVertexBuffer,
      new Float32Array(selectedVertices.flat())
    );
    simpleWebGPU.writeBuffer(
      this.objectIDBuffer,
      new Uint32Array([this.numberID])
    );
    simpleWebGPU.writeBuffer(
      this.boneVertexBuffer,
      new Float32Array(
        armature.bones.map((bone) => [...bone.model.head, ...bone.model.tail]).flat(),
      ),
    );
    simpleWebGPU.writeBuffer(
      this.selectBoneBuffer,
      new Float32Array(
        selectedBone
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

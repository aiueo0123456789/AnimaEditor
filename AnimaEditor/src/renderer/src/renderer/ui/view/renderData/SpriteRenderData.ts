import { Runtime_Sprite } from "../../../../core/projectCache/runtime/Sprite";
import { SpriteState } from "../../../../editor/editorState/state/Sprite";
import { simpleWebGPU } from "../../../../util/simpleWebGPU";
import { View_ModelRenderData } from "./ModelRenderData";

export class View_SpriteRenderData extends View_ModelRenderData {
  public vertexBuffer: GPUBuffer | null;
  public texcoordBuffer: GPUBuffer | null;
  public indexBuffer: GPUBuffer | null;
  public edgeBuffer: GPUBuffer | null;
  public silhouetteEdgeBuffer: GPUBuffer | null;

  public selectVertexBuffer: GPUBuffer | null;

  public objectIDBuffer: GPUBuffer;

  constructor(numberID: number) {
    super(numberID);
    this.vertexBuffer = null;
    this.texcoordBuffer = null;
    this.indexBuffer = null;
    this.edgeBuffer = null;
    this.silhouetteEdgeBuffer = null;

    this.selectVertexBuffer = null;

    this.objectIDBuffer = simpleWebGPU.createBuffer(4, ["U"]);
  }

  public update(sprite: Runtime_Sprite, spriteState: SpriteState): void {
    if (sprite.verticesNum * 2 * 4 !== this.vertexBuffer?.size) this.vertexBuffer = simpleWebGPU.createBuffer(sprite.verticesNum * 2 * 4, ["V", "S"]);
    if (sprite.verticesNum * 2 * 4 !== this.texcoordBuffer?.size) this.texcoordBuffer = simpleWebGPU.createBuffer(sprite.verticesNum * 2 * 4, ["V"]);
    if (sprite.verticesNum * 2 * 4 !== this.selectVertexBuffer?.size) this.selectVertexBuffer = simpleWebGPU.createBuffer(sprite.verticesNum * 2 * 4, ["S"]);
    if (sprite.edgesNum * 2 * 4 !== this.edgeBuffer?.size) this.edgeBuffer = simpleWebGPU.createBuffer(sprite.edgesNum * 2 * 4, ["S"]);
    if (sprite.silhouetteEdgesNum * 2 * 4 !== this.silhouetteEdgeBuffer?.size) this.silhouetteEdgeBuffer = simpleWebGPU.createBuffer(sprite.silhouetteEdgesNum * 2 * 4, ["S"]);
    if (sprite.indicesNum * 3 * 4 !== this.indexBuffer?.size) this.indexBuffer = simpleWebGPU.createBuffer(sprite.indicesNum * 3 * 4, ["I", "S"]);

    simpleWebGPU.writeBuffer(
      this.objectIDBuffer,
      new Uint32Array([this.numberID])
    );
    simpleWebGPU.writeBuffer(
      this.vertexBuffer,
      new Float32Array(sprite.vertices.flat())
      // simpleWebGPU.createBitData(sprite.vertices.flat(), ["f32", "f32"]),
    );
    simpleWebGPU.writeBuffer(
      this.selectVertexBuffer,
      // simpleWebGPU.createBitData(
      //   sprite.vertices
      //     .filter((v, vi) => spriteState.selectVertexIndices.includes(vi))
      //     .flat(),
      //   ["f32", "f32"],
      // ),
      new Float32Array(spriteState.selectedVertexIndices.map(vi => sprite.vertices[vi]).flat())
    );
    simpleWebGPU.writeBuffer(
      this.texcoordBuffer,
      new Float32Array(sprite.texcoords.flat())
      // simpleWebGPU.createBitData(sprite.texcoords.flat(), ["f32", "f32"]),
    );
    simpleWebGPU.writeBuffer(
      this.edgeBuffer,
      new Uint32Array(sprite.edges.flat())
      // simpleWebGPU.createBitData(sprite.model.edges.flat(), ["u32", "u32"]),
    );
    simpleWebGPU.writeBuffer(
      this.silhouetteEdgeBuffer,
      new Uint32Array(sprite.silhouetteEdges.flat())
      // simpleWebGPU.createBitData(sprite.model.edges.flat(), ["u32", "u32"]),
    );
    simpleWebGPU.writeBuffer(
      this.indexBuffer,
      new Uint32Array(sprite.indices.flat())
      // simpleWebGPU.createBitData(sprite.indices.flat(), ["u32", "u32", "u32"]),
    );
  }
}
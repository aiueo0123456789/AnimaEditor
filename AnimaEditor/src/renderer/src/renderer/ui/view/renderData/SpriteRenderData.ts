import { Runtime_Sprite } from "../../../../core/projectCache/runtime/Sprite";
import { SpriteState } from "../../../../editor/editorState/state/States/Sprite";
import { simpleWebGPU } from "../../../../util/simpleWebGPU";
import { View_ModelRenderData } from "./ModelRenderData";
import type { ViewGeometrySource } from "../ViewGeometry";
import { spriteMaskParams } from "./MaskRenderer";

export class View_SpriteRenderData extends View_ModelRenderData {
  public selectedVertexCount = 0;
  public vertexBuffer: GPUBuffer | null;
  public texcoordBuffer: GPUBuffer | null;
  public indexBuffer: GPUBuffer | null;
  public edgeBuffer: GPUBuffer | null;
  public silhouetteEdgeBuffer: GPUBuffer | null;
  public weightBuffer: GPUBuffer | null;
  public parmsBuffer: GPUBuffer = simpleWebGPU.createBuffer(4 * 4, ["U"]);

  public selectVertexBuffer: GPUBuffer | null;

  public objectIDBuffer: GPUBuffer = simpleWebGPU.createBuffer(4, ["U"]);

  constructor(numberID: number) {
    super(numberID);
    this.vertexBuffer = null;
    this.texcoordBuffer = null;
    this.indexBuffer = null;
    this.edgeBuffer = null;
    this.silhouetteEdgeBuffer = null;
    this.weightBuffer = null;

    this.selectVertexBuffer = null;
  }

  public update(sprite: Runtime_Sprite, spriteState: SpriteState, source: ViewGeometrySource = "runtime"): void {
    // Keep the runtime index order for shared topology and UVs, even in Model mode.
    const vertices = source === "runtime" ? sprite.vertices : sprite.vertices.map(() => [0, 0]);
    if (source === "model") for (const [id, index] of sprite.vertexIDMap) {
      if (sprite.model.vertices[id]) vertices[index] = sprite.model.vertices[id].co;
    }
    const selectedVertices = [...new Set(spriteState.selectedVertexIDs)].flatMap(id => {
      const index = sprite.vertexIDMap.get(id);
      return index === undefined || !vertices[index] ? [] : [vertices[index]];
    });
    this.selectedVertexCount = selectedVertices.length;
    if (Math.max(32, sprite.verticesNum * 1 * 4) !== this.weightBuffer?.size) {
      this.weightBuffer?.destroy();
      this.weightBuffer = simpleWebGPU.createBuffer(Math.max(32, sprite.verticesNum * 1 * 4), ["V", "S"]);
    }
    if (Math.max(32, sprite.verticesNum * 2 * 4) !== this.vertexBuffer?.size) {
      this.vertexBuffer?.destroy();
      this.vertexBuffer = simpleWebGPU.createBuffer(Math.max(32, sprite.verticesNum * 2 * 4), ["V", "S"]);
    }
    if (Math.max(32, sprite.verticesNum * 2 * 4) !== this.texcoordBuffer?.size) {
      this.texcoordBuffer?.destroy();
      this.texcoordBuffer = simpleWebGPU.createBuffer(Math.max(32, sprite.verticesNum * 2 * 4), ["V"]);
    }
    if (Math.max(32, sprite.verticesNum * 2 * 4) !== this.selectVertexBuffer?.size) {
      this.selectVertexBuffer?.destroy();
      this.selectVertexBuffer = simpleWebGPU.createBuffer(Math.max(32, sprite.verticesNum * 2 * 4), ["S"]);
    }
    if (Math.max(32, sprite.edgesNum * 2 * 4) !== this.edgeBuffer?.size) {
      this.edgeBuffer?.destroy();
      this.edgeBuffer = simpleWebGPU.createBuffer(Math.max(32, sprite.edgesNum * 2 * 4), ["S"]);
    }
    if (Math.max(32, sprite.silhouetteEdgesNum * 2 * 4) !== this.silhouetteEdgeBuffer?.size) {
      this.silhouetteEdgeBuffer?.destroy();
      this.silhouetteEdgeBuffer = simpleWebGPU.createBuffer(Math.max(32, sprite.silhouetteEdgesNum * 2 * 4), ["S"]);
    }
    if (Math.max(32, sprite.indicesNum * 3 * 4) !== this.indexBuffer?.size) {
      this.indexBuffer?.destroy();
      this.indexBuffer = simpleWebGPU.createBuffer(Math.max(32, sprite.indicesNum * 3 * 4), ["I", "S"]);
    }

    simpleWebGPU.writeBuffer(
      this.parmsBuffer,
      spriteMaskParams(sprite)
    );
    simpleWebGPU.writeBuffer(
      this.objectIDBuffer,
      new Uint32Array([this.numberID])
    );
    const activeBoneWeightIndex = sprite.boneWeightIDMap.get(spriteState.activeBoneWeightID);
    if (typeof activeBoneWeightIndex === "number") {
      const activeBoneWeight = sprite.boneWeights[activeBoneWeightIndex];
      simpleWebGPU.writeBuffer(
        this.weightBuffer,
        new Float32Array(activeBoneWeight?.weights.flat())
      );
    } else {
      simpleWebGPU.writeBuffer(
        this.weightBuffer,
        new Float32Array(sprite.verticesNum)
      );
    }
    simpleWebGPU.writeBuffer(
      this.vertexBuffer,
      new Float32Array(vertices.flat())
    );
    simpleWebGPU.writeBuffer(
      this.selectVertexBuffer,
      new Float32Array(selectedVertices.flat())
    );
    simpleWebGPU.writeBuffer(
      this.texcoordBuffer,
      new Float32Array(sprite.texcoords.flat())
    );
    simpleWebGPU.writeBuffer(
      this.edgeBuffer,
      new Uint32Array(sprite.edges.flat())
    );
    simpleWebGPU.writeBuffer(
      this.silhouetteEdgeBuffer,
      new Uint32Array(sprite.silhouetteEdges.flat())
    );
    simpleWebGPU.writeBuffer(
      this.indexBuffer,
      new Uint32Array(sprite.indices.flat())
    );
  }
}

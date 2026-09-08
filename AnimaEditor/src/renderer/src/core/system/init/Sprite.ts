import { AnimaEditor } from "../../../editor/Editor";
import { cdt } from "../../../library/CDT/cdt";
import { cutSilhouetteOutTriangle } from "../../../library/CDT/createMesh";
import { Vec2Math, Vec3Math } from "../../../util/vecMath";
import { Runtime_Sprite } from "../../projectCache/runtime/Sprite";
import { System } from "../System";

/**
 * ランタイムメッシュの初期化
 */
export class System_Sprite extends System {
  constructor(editor: AnimaEditor) {
    super(editor);
  }

  public override start(): void {
  }

  public override end(): void {
  }

  public override update(): void {
    const targets = this.editor.projectCache.getRuntimesByType(Runtime_Sprite);
    for (const runtime of targets) {
      const model = runtime.model;

      if (runtime.zIndex !== model.zIndex) {
        runtime.zIndex = model.zIndex;
      }

      if (runtime.boneWeights.length !== model.boneWeights.length) {
        runtime.boneWeights.length = 0;
        for (let i = 0; i < model.boneWeights.length; i++) {
          const boneWeight = Runtime_Sprite.createBoneWeight();
          runtime.boneWeights.push(boneWeight);
        }
      }

      let isChangedVertex = false;
      if (runtime.vertices.length !== model.vertices.length) {
        isChangedVertex = true;
        runtime.vertices.length = 0;
        runtime.texcoords.length = 0;
        runtime.vertexIDMap.clear();
        for (let vi = 0; vi < model.vertices.length; vi++) {
          runtime.vertices.push(Runtime_Sprite.createVertex());
          runtime.texcoords.push(Runtime_Sprite.createTexcoord());
          runtime.vertexIDMap.set(model.vertices[vi].id, vi);
        }

        for (let i = 0; i < model.boneWeights.length; i++) {
          const boneWeight = runtime.boneWeights[i];
          boneWeight.weights.length = 0;
          for (const weight of model.boneWeights[i].weights) {
            boneWeight.weights.push(weight);
          }
        }
      }

      let isChangedEdge = false;
      if (runtime.edges.length !== model.edges.length) {
        isChangedEdge = true;
        runtime.edges.length = 0;
        runtime.edgeIDMap.clear();
        for (let ei = 0; ei < model.edges.length; ei++) {
          const edge = Runtime_Sprite.createEdge();
          runtime.edges.push(edge);
          runtime.edgeIDMap.set(model.edges[ei].id, ei);
        }
      }

      if (runtime.silhouetteEdges.length !== model.silhouetteEdges.length) {
        isChangedEdge = true;
        runtime.silhouetteEdges.length = 0;
        runtime.silhouetteEdgeIDMap.clear();
        for (let ei = 0; ei < model.silhouetteEdges.length; ei++) {
          const edge = Runtime_Sprite.createEdge();
          runtime.silhouetteEdges.push(edge);
          runtime.silhouetteEdgeIDMap.set(model.silhouetteEdges[ei].id, ei);
        }
      }

      let hasChanged = isChangedVertex || isChangedEdge;
      if (isChangedVertex || isChangedEdge) {
        for (const me of model.edges) {
          const rei = runtime.edgeIDMap.get(me.id) ?? 0;
          const re = runtime.edges[rei];
          re[0] = runtime.vertexIDMap.get(me.vertices[0]) ?? 0;
          re[1] = runtime.vertexIDMap.get(me.vertices[1]) ?? 0;
        }
        for (const me of model.silhouetteEdges) {
          const rei = runtime.silhouetteEdgeIDMap.get(me.id) ?? 0;
          const re = runtime.silhouetteEdges[rei];
          re[0] = runtime.vertexIDMap.get(me.vertices[0]) ?? 0;
          re[1] = runtime.vertexIDMap.get(me.vertices[1]) ?? 0;
        }
      }

      for (let i = 0; i < model.verticesNum; i++) {
        if (!Vec2Math.equal(model.vertices[i].co, runtime.vertices[i], 0.001)) {
          hasChanged = true;
        }
        Vec2Math.copy(model.vertices[i].co, runtime.vertices[i]);
        Vec2Math.copy(
          Vec2Math.flipY(
            Vec2Math.div(
              Vec2Math.sub(model.vertices[i].co, model.textureRect.min),
              Vec2Math.sub(model.textureRect.max, model.textureRect.min),
            ),
            1,
          ),
          runtime.texcoords[i],
        );
      }

      if (hasChanged) {
        const indices = cutSilhouetteOutTriangle(runtime.vertices, cdt(runtime.vertices, runtime.edges), runtime.silhouetteEdges);
        // const indices = cdt(runtime.vertices, runtime.edges);
        runtime.indices.length = 0;
        for (let i = 0; i < indices.length; i++) {
          const index = Runtime_Sprite.createIndex();
          Vec3Math.copy(indices[i], index);
          runtime.indices.push(index);
        }
      }
    }
  }
}

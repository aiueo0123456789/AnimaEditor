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

      const modelBoneWeights = Object.entries(model.boneWeights);
      if (runtime.boneWeights.length !== modelBoneWeights.length ||
          modelBoneWeights.some(([boneWeightID], index) => runtime.boneWeightIDMap.get(boneWeightID) !== index)) {
        runtime.boneWeights.length = 0;
        runtime.boneWeightIDMap.clear();
        for (const [boneWeightID] of modelBoneWeights) {
          const boneWeight = Runtime_Sprite.createBoneWeight(boneWeightID);
          runtime.boneWeightIDMap.set(boneWeightID, runtime.boneWeights.length);
          runtime.boneWeights.push(boneWeight);
        }
      }

      let isChangedVertex = false;
      const modelVertices = Object.entries(model.vertices);
      if (runtime.vertices.length !== modelVertices.length ||
          modelVertices.some(([vertexID], index) => runtime.vertexIDMap.get(vertexID) !== index)) {
        isChangedVertex = true;
        runtime.vertices.length = 0;
        runtime.texcoords.length = 0;
        runtime.vertexIDMap.clear();
        for (let vi = 0; vi < modelVertices.length; vi++) {
          runtime.vertices.push(Runtime_Sprite.createVertex());
          runtime.texcoords.push(Runtime_Sprite.createTexcoord());
          runtime.vertexIDMap.set(modelVertices[vi][0], vi);

          for (const boneWeight of runtime.boneWeights) { // ウェイトの数を頂点数に揃える
            boneWeight.weights.push(0);
          }
        }
      }

      for (const [boneWeightID, modelBoneWeight] of modelBoneWeights) {
        const source = modelBoneWeight.weights;
        const runtimeBoneWeightIndex = runtime.boneWeightIDMap.get(boneWeightID);

        if (typeof runtimeBoneWeightIndex !== "number") {
          console.error("存在しないボーンウェイトです");
          return ;
        }

        const weights = runtime.boneWeights[runtimeBoneWeightIndex].weights;
        weights.length = modelVertices.length;
        for (let vi = 0; vi < modelVertices.length; vi++) {
          weights[vi] = source[modelVertices[vi][0]] ?? 0;
        }
      }

      let isChangedEdge = false;
      const modelEdges = Object.entries(model.edges).filter(([, edge]) => edge.vertices.every(id => runtime.vertexIDMap.has(id)));
      if (runtime.edges.length !== modelEdges.length || modelEdges.some(([edgeID], index) => runtime.edgeIDMap.get(edgeID) !== index)) {
        isChangedEdge = true;
        runtime.edges.length = 0;
        runtime.edgeIDMap.clear();
        for (let ei = 0; ei < modelEdges.length; ei++) {
          const edge = Runtime_Sprite.createEdge();
          runtime.edges.push(edge);
          runtime.edgeIDMap.set(modelEdges[ei][0], ei);
        }
      }

      const modelSilhouetteEdges = Object.entries(model.silhouetteEdges).filter(([, edge]) => edge.vertices.every(id => runtime.vertexIDMap.has(id)));
      if (runtime.silhouetteEdges.length !== modelSilhouetteEdges.length || modelSilhouetteEdges.some(([edgeID], index) => runtime.silhouetteEdgeIDMap.get(edgeID) !== index)) {
        isChangedEdge = true;
        runtime.silhouetteEdges.length = 0;
        runtime.silhouetteEdgeIDMap.clear();
        for (let ei = 0; ei < modelSilhouetteEdges.length; ei++) {
          const edge = Runtime_Sprite.createEdge();
          runtime.silhouetteEdges.push(edge);
          runtime.silhouetteEdgeIDMap.set(modelSilhouetteEdges[ei][0], ei);
        }
      }

      for (const [edgeID, me] of modelEdges) {
          const rei = runtime.edgeIDMap.get(edgeID) ?? 0;
          const re = runtime.edges[rei];
          const a = runtime.vertexIDMap.get(me.vertices[0])!;
          const b = runtime.vertexIDMap.get(me.vertices[1])!;
          if (re[0] !== a || re[1] !== b) isChangedEdge = true;
          re[0] = a;
          re[1] = b;
      }
      for (const [edgeID, me] of modelSilhouetteEdges) {
          const rei = runtime.silhouetteEdgeIDMap.get(edgeID) ?? 0;
          const re = runtime.silhouetteEdges[rei];
          const a = runtime.vertexIDMap.get(me.vertices[0])!;
          const b = runtime.vertexIDMap.get(me.vertices[1])!;
          if (re[0] !== a || re[1] !== b) isChangedEdge = true;
          re[0] = a;
          re[1] = b;
      }

      let hasChanged = isChangedVertex || isChangedEdge;

      for (let i = 0; i < modelVertices.length; i++) {
        const vertex = modelVertices[i][1];
        if (!Vec2Math.equal(vertex.co, runtime.vertices[i], 0.001)) {
          hasChanged = true;
        }
        Vec2Math.copy(vertex.co, runtime.vertices[i]);
        Vec2Math.copy(
          Vec2Math.flipY(
            Vec2Math.div(
              Vec2Math.sub(vertex.co, model.textureRect.min),
              Vec2Math.sub(model.textureRect.max, model.textureRect.min),
            ),
            1,
          ),
          runtime.texcoords[i],
        );
      }

      if (hasChanged) {
        const indices = runtime.vertices.length < 3 ? [] : cutSilhouetteOutTriangle(runtime.vertices, cdt(runtime.vertices, runtime.edges), runtime.silhouetteEdges);
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

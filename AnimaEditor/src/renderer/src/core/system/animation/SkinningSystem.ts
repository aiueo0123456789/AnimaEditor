import { AnimaEditor } from "../../../editor/Editor";
import { Mat3Math, Vec2Math } from "../../../util/vecMath";
import { Runtime_Sprite } from "../../projectCache/runtime/Sprite";
import { System } from "../System";

/**
 * ランタイムメッシュの初期化
 */
export class System_Skinning extends System {
  constructor(editor: AnimaEditor) {
    super(editor);
  }

  public override start(): void {
  }

  public override end(): void {
  }

  public override update(): void {
    const targets = this.editor.projectCache.getRuntimesByType(Runtime_Sprite);
    for (const target of targets) {
      if (target.boneWeights.length) {
        const sumWeights = target.vertices.map(vertex => 0);

        target.boneWeights.forEach(boneWeight => {
          boneWeight.weights.forEach((weight, vi) => {
            sumWeights[vi] += weight;
          })
        })

        const baseVertices = target.vertices.map(vertex => Vec2Math.copy(vertex));
        target.vertices.forEach((vertex, vi) => {
          if (sumWeights[vi] !== 0) Vec2Math.clear(vertex);
        });
        for (const boneWeight of target.boneWeights) {
          const bone = boneWeight.bone;
          if (!bone) continue ;

          const boneBaseMatrix = bone.base.inverWorldMatrix;
          const bonePoseMatrix = bone.pose.worldMatrix;

          for (let i = 0; i < target.verticesNum; i++) {
            Vec2Math.add(
              target.vertices[i],
              Vec2Math.mul(
                Mat3Math.transformPoint(
                  Mat3Math.transformPoint(baseVertices[i], boneBaseMatrix),
                  bonePoseMatrix,
                ),
                Vec2Math.create(boneWeight.weights[i], boneWeight.weights[i]),
              ),
              target.vertices[i],
            );
          }
        }
      }
    }
  }
}

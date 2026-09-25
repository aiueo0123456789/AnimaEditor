import { AnimaEditor } from "../../../editor/Editor";
import { Mat3, Mat3Math, Vec2, Vec2Math } from "../../../util/vecMath";
import { Runtime_Armature } from "../../projectCache/runtime/Armature";
import { System } from "../System";

function calcBoneTransform(head: Vec2, tail: Vec2): {
  position: Vec2,
  rotation: number,
  scale: Vec2,
  length: number,
} {
  const d = Vec2Math.sub(tail, head);

  const length = Math.hypot(d[0], d[1]);
  const rotation = Math.atan2(d[1], d[0]);

  return {
    position: Vec2Math.copy(head),
    rotation,
    scale: Vec2Math.create(1, 1),
    length: length,
  };
}

export function getMatrixByTransform(position: Vec2, rotation: number, scale: Vec2): Mat3 {
  const t = Mat3Math.translation(position);
  const r = Mat3Math.rotation(rotation);
  const s = Mat3Math.scaling(scale);
  return Mat3Math.multiply(t, Mat3Math.multiply(r, s));
}

export function getTransformByMatrix(matrix: Mat3): { position: Vec2; rotation: number; scale: Vec2 } {
  // wgpu-matrix系のMat3レイアウト: 各列が4要素にパディングされた列優先配列
  // matrix[0], matrix[1] = 列0 (m00, m10)
  // matrix[3], matrix[4] = 列1 (m01, m11)
  // matrix[6], matrix[7] = 列2 (tx, ty)

  const m00 = matrix[0];
  const m10 = matrix[1];
  const m01 = matrix[3];
  const m11 = matrix[4];
  const tx = matrix[6];
  const ty = matrix[7];

  // 平行移動
  const position: Vec2 = Vec2Math.create(tx, ty);

  // スケール(各軸ベクトルの長さ)
  const scaleX = Math.sqrt(m00 * m00 + m10 * m10);
  let scaleY = Math.sqrt(m01 * m01 + m11 * m11);

  // 負のスケール(反転)を検出: 行列式が負ならY軸スケールを負にする
  const det = m00 * m11 - m01 * m10;
  if (det < 0) {
    scaleY = -scaleY;
  }

  const scale: Vec2 = [scaleX, scaleY] as Vec2;

  // 回転(スケールを除去した後のcos, sinから復元)
  const rotation = Math.atan2(m10 / scaleX, m00 / scaleX);

  return { position, rotation, scale };
}

/**
 * ランタイムボーンの初期化
 */
export class System_Init_Armature extends System {
  constructor(editor: AnimaEditor) {
    super(editor);
  }

  public override start(): void {
  }

  public override end(): void {
  }

  public override update(): void {
    const targets = this.editor.projectCache.getRuntimesByType(Runtime_Armature);
    for (const runtime of targets) {
      const model = runtime.model;

      const previous = new Map(runtime.bones.map(bone => [bone.boneID, bone]));
      const remaining = new Map(Object.entries(model.bones));
      const ordered: [string, typeof model.bones[string]][] = [];
      while (remaining.size) {
        let progressed = false;
        for (const [boneID, bone] of remaining) {
          const parent = bone.parentID;
          if (!parent || parent.aramatureID !== model.id || !remaining.has(parent.boneID)) {
            ordered.push([boneID, bone]);
            remaining.delete(boneID);
            progressed = true;
          }
        }
        if (!progressed) {
          ordered.push(...remaining);
          remaining.clear();
        }
      }
      const structureChanged = runtime.bones.length !== ordered.length ||
        ordered.some(([boneID, bone], index) =>
          runtime.bones[index]?.boneID !== boneID || runtime.bones[index]?.model !== bone);
      if (structureChanged) {
        runtime.bones = ordered.map(([boneID, bone]) => {
          const current = previous.get(boneID);
          if (current?.model === bone) return current;
          return Runtime_Armature.createBone(boneID, bone);
        });
        runtime.boneIDMap.clear();
        for (let bi = 0; bi < runtime.bones.length; bi++) runtime.boneIDMap.set(runtime.bones[bi].boneID, bi);
      }

      for (let bi = 0; bi < runtime.bones.length; bi++) {
        const rb = runtime.bones[bi];
        const transformValue = calcBoneTransform(rb.model.head, rb.model.tail);
        Vec2Math.copy(transformValue.position, rb.base.position);
        Vec2Math.copy(transformValue.scale, rb.base.scale);
        rb.base.rotation = transformValue.rotation;
        rb.base.length = transformValue.length;
        const baseWorldMatrix = getMatrixByTransform(rb.base.position, rb.base.rotation, rb.base.scale);
        Mat3Math.copy(baseWorldMatrix, rb.base.worldMatrix);
        Mat3Math.inverse(baseWorldMatrix, rb.base.inverWorldMatrix);
      }
      for (const rb of runtime.bones) {
        const parent = rb.model.parentID;
        rb.parent = parent?.aramatureID === model.id ? runtime.getBoneByID(parent.boneID) : null;
      }
      for (const rb of runtime.bones) {
        if (rb.parent) Mat3Math.multiply(rb.parent.base.inverWorldMatrix, rb.base.worldMatrix, rb.base.localMatrix);
        else Mat3Math.copy(rb.base.worldMatrix, rb.base.localMatrix);
      }
    }
  }
}

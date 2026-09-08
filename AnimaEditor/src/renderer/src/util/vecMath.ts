export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type Mat3 = [
  number, number, number,
  number, number, number,
  number, number, number,
];

export class Vec2Math {
  static create(x = 0, y = 0): Vec2 {
    return [x, y];
  }
  static clear(dst?: Vec2): Vec2 {
    const newDst = dst ?? this.create();
    newDst[0] = 0;
    newDst[1] = 0;
    return newDst;
  }
  static set(x: number, y: number, dst?: Vec2): Vec2 {
    const newDst = dst ?? this.create();
    newDst[0] = x;
    newDst[1] = y;
    return newDst;
  }
  static add(a: Vec2, b: Vec2, dst?: Vec2): Vec2 {
    const newDst = dst ?? this.create();
    newDst[0] = a[0] + b[0];
    newDst[1] = a[1] + b[1];
    return newDst;
  }
  static sub(a: Vec2, b: Vec2, dst?: Vec2): Vec2 {
    const newDst = dst ?? this.create();
    newDst[0] = a[0] - b[0];
    newDst[1] = a[1] - b[1];
    return newDst;
  }
  static mul(a: Vec2, b: Vec2, dst?: Vec2): Vec2 {
    const newDst = dst ?? this.create();
    newDst[0] = a[0] * b[0];
    newDst[1] = a[1] * b[1];
    return newDst;
  }
  static length(a: Vec2): number {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1]);
  }
  static distance(a: Vec2, b: Vec2): number {
    return this.length(this.sub(a, b));
  }
  static div(a: Vec2, b: Vec2, dst?: Vec2): Vec2 {
    const newDst = dst ?? this.create();
    newDst[0] = a[0] / b[0];
    newDst[1] = a[1] / b[1];
    return newDst;
  }

  static cross(a: Vec2, b: Vec2): number {
    return a[0] * b[1] - b[0] * a[1];
  }

  static cross3(a: Vec2, b: Vec2, c: Vec2): number {
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  }

  static normalize(a: Vec2, dst?: Vec2): Vec2 {
    const newDst = dst ?? this.create();
    const len = this.length(a);
    newDst[0] = a[0] / len;
    newDst[1] = a[1] / len;
    return newDst;
  }

  static rotate(point: Vec2, angle: number, dst?: Vec2): Vec2 {
    const newDst = dst ?? this.create();
    const sinTheta = Math.sin(angle);
    const cosTheta = Math.cos(angle);
    newDst[0] = point[0] * cosTheta - point[1] * sinTheta;
    newDst[1] = point[0] * sinTheta + point[1] * cosTheta;
    return newDst;
  }

  static copy(a: Vec2, dst?: Vec2): Vec2 {
    const newDst = dst ?? this.create();
    newDst[0] = a[0];
    newDst[1] = a[1];
    return newDst;
  }
  static flipY(a: Vec2, height: number, dst?: Vec2): Vec2 {
    const newDst = dst ?? this.create();
    newDst[0] = a[0];
    newDst[1] = height - a[1];
    return newDst;
  }

  static equal(a: Vec2, b: Vec2, e = 0): boolean {
    if (e === 0) {
      return a[0] === b[0] && a[1] === b[1];
    } else {
      return Math.abs(a[0] - b[0]) < e && Math.abs(a[1] - b[1]) < e;
    }
  }

  static min(a: Vec2, b: Vec2, dst?: Vec2): Vec2 {
    const newDst = dst ?? this.create();
    newDst[0] = Math.min(a[0], b[0]);
    newDst[1] = Math.min(a[1], b[1]);
    return newDst;
  }
  static max(a: Vec2, b: Vec2, dst?: Vec2): Vec2 {
    const newDst = dst ?? this.create();
    newDst[0] = Math.max(a[0], b[0]);
    newDst[1] = Math.max(a[1], b[1]);
    return newDst;
  }
}

export class Vec3Math {
  static create(x = 0, y = 0, z = 0): Vec3 {
    return [x, y, z];
  }
  static clear(dst?: Vec3): Vec3 {
    const newDst = dst ?? this.create();
    newDst[0] = 0;
    newDst[1] = 0;
    newDst[2] = 0;
    return newDst;
  }
  static set(x: number, y: number, z: number, dst?: Vec3): Vec3 {
    const newDst = dst ?? this.create();
    newDst[0] = x;
    newDst[1] = y;
    newDst[2] = z;
    return newDst;
  }
  static add(a: Vec3, b: Vec3, dst?: Vec3): Vec3 {
    const newDst = dst ?? this.create();
    newDst[0] = a[0] + b[0];
    newDst[1] = a[1] + b[1];
    newDst[2] = a[2] + b[2];
    return newDst;
  }
  static sub(a: Vec3, b: Vec3, dst?: Vec3): Vec3 {
    const newDst = dst ?? this.create();
    newDst[0] = a[0] - b[0];
    newDst[1] = a[1] - b[1];
    newDst[2] = a[2] - b[2];
    return newDst;
  }
  static mul(a: Vec3, b: Vec3, dst?: Vec3): Vec3 {
    const newDst = dst ?? this.create();
    newDst[0] = a[0] * b[0];
    newDst[1] = a[1] * b[1];
    newDst[2] = a[2] * b[2];
    return newDst;
  }
  static div(a: Vec3, b: Vec3, dst?: Vec3): Vec3 {
    const newDst = dst ?? this.create();
    newDst[0] = a[0] / b[0];
    newDst[1] = a[1] / b[1];
    newDst[2] = a[2] / b[2];
    return newDst;
  }
  static copy(a: Vec3, dst?: Vec3): Vec3 {
    const newDst = dst ?? this.create();
    newDst[0] = a[0];
    newDst[1] = a[1];
    newDst[2] = a[2];
    return newDst;
  }
}

export class Mat3Math {
  static create(
    x0 = 0, y0 = 0, z0 = 0,
    x1 = 0, y1 = 0, z1 = 0,
    x2 = 0, y2 = 0, z2 = 0,
  ): Mat3 {
    return [x0, y0, z0, x1, y1, z1, x2, y2, z2];
  }

  static copy(a: Mat3, dst?: Mat3) {
    const newDst = dst ?? Mat3Math.create();
    newDst[0] = a[0]; newDst[1] = a[1]; newDst[2] = a[2];
    newDst[3] = a[3]; newDst[4] = a[4]; newDst[5] = a[5];
    newDst[6] = a[6]; newDst[7] = a[7]; newDst[8] = a[8];
    return newDst;
  }

  // a * b（列優先: index = col*3 + row）
  static multiply(a: Mat3, b: Mat3, dst?: Mat3): Mat3 {
    const newDst = dst ?? Mat3Math.create();
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 3; row++) {
        let sum = 0;
        for (let k = 0; k < 3; k++) {
          sum += a[k * 3 + row] * b[col * 3 + k];
        }
        newDst[col * 3 + row] = sum;
      }
    }
    return newDst;
  }

  // 単位行列
  static identity(dst?: Mat3): Mat3 {
    const newDst = dst ?? Mat3Math.create();
    newDst[0] = 1; newDst[1] = 0; newDst[2] = 0;
    newDst[3] = 0; newDst[4] = 1; newDst[5] = 0;
    newDst[6] = 0; newDst[7] = 0; newDst[8] = 1;
    return newDst;
  }

  // 平行移動
  // | 1  0  0 |
  // | 0  1  0 |
  // | tx ty 1 |
  static translation(a: Vec2, dst?: Mat3): Mat3 {
    const newDst = dst ?? Mat3Math.create();
    newDst[0] = 1; newDst[1] = 0; newDst[2] = 0;
    newDst[3] = 0; newDst[4] = 1; newDst[5] = 0;
    newDst[6] = a[0]; newDst[7] = a[1]; newDst[8] = 1;
    return newDst;
  }

  // 拡大縮小
  // | sx 0  0 |
  // | 0  sy 0 |
  // | 0  0  1 |
  static scaling(a: Vec2, dst?: Mat3): Mat3 {
    const newDst = dst ?? Mat3Math.create();
    newDst[0] = a[0]; newDst[1] = 0; newDst[2] = 0;
    newDst[3] = 0; newDst[4] = a[1]; newDst[5] = 0;
    newDst[6] = 0; newDst[7] = 0; newDst[8] = 1;
    return newDst;
  }

  // 回転（ラジアン、反時計回り）
  // | c  s  0 |
  // |-s  c  0 |
  // | 0  0  1 |
  static rotation(rad: number, dst?: Mat3): Mat3 {
    const newDst = dst ?? Mat3Math.create();
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    newDst[0] = c; newDst[1] = s; newDst[2] = 0;
    newDst[3] = -s; newDst[4] = c; newDst[5] = 0;
    newDst[6] = 0; newDst[7] = 0; newDst[8] = 1;
    return newDst;
  }

  // ベクトルに行列を適用（vec2 → 同次座標として処理）
  static transformPoint(v: Vec2, m: Mat3, dst?: Vec2): Vec2 {
    const newDst = dst ?? Vec2Math.create();
    const x = v[0];
    const y = v[1];
    newDst[0] = m[0] * x + m[3] * y + m[6];
    newDst[1] = m[1] * x + m[4] * y + m[7];
    return newDst;
  }

  // 逆行列（列優先）
  static inverse(a: Mat3, dst?: Mat3): Mat3 {
    const newDst = dst ?? Mat3Math.create();

    // 各要素（列優先: index = col*3 + row）
    const a00 = a[0], a10 = a[1], a20 = a[2];
    const a01 = a[3], a11 = a[4], a21 = a[5];
    const a02 = a[6], a12 = a[7], a22 = a[8];

    // 余因子
    const c00 = a11 * a22 - a12 * a21;
    const c10 = -(a01 * a22 - a02 * a21);
    const c20 = a01 * a12 - a02 * a11;

    const c01 = -(a10 * a22 - a12 * a20);
    const c11 = a00 * a22 - a02 * a20;
    const c21 = -(a00 * a12 - a02 * a10);

    const c02 = a10 * a21 - a11 * a20;
    const c12 = -(a00 * a21 - a01 * a20);
    const c22 = a00 * a11 - a01 * a10;

    // 行列式
    const det = a00 * c00 + a01 * c01 + a02 * c02;
    if (Math.abs(det) < 1e-10) {
      console.warn("Matrix3.inverse: 行列式が0（逆行列なし）");
      return Mat3Math.identity(newDst);
    }

    const invDet = 1 / det;

    // 転置した余因子行列 × (1/det)
    newDst[0] = c00 * invDet;
    newDst[1] = c01 * invDet;
    newDst[2] = c02 * invDet;
    newDst[3] = c10 * invDet;
    newDst[4] = c11 * invDet;
    newDst[5] = c12 * invDet;
    newDst[6] = c20 * invDet;
    newDst[7] = c21 * invDet;
    newDst[8] = c22 * invDet;

    return newDst;
  }
}
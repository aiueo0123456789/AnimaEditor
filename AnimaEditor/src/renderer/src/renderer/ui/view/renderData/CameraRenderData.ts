import { simpleWebGPU } from "../../../../util/simpleWebGPU";
import { Mat3Math, Vec2Math } from "../../../../util/vecMath";
import { View_Camera } from "../Camera";

export class CameraRenderData {
  public cameraBuffer: GPUBuffer;
  constructor() {
    this.cameraBuffer = simpleWebGPU.createBuffer((4 * 3 * 2 + 2 + 2) * 4, [
      "U",
    ]);
  }

  update(camera: View_Camera, width: number, height: number) {
    const T = Mat3Math.translation(Vec2Math.sub(Vec2Math.create(), camera.position)); // -camPos
    const R = Mat3Math.rotation(-camera.rotation);
    const S = Mat3Math.scaling(Vec2Math.create(camera.zoom, camera.zoom));
    const P = Mat3Math.create(2 / width, 0, 0, 0, 2 / height, 0, 0, 0, 1);

    // multiply(a, b)*v = a*(b*v) なので後ろの引数が先に適用される
    const RT = Mat3Math.multiply(R, T); // T → R
    const SRT = Mat3Math.multiply(S, RT); // T → R → S（スケールはカメラ原点中心）
    const VP = Mat3Math.multiply(P, SRT); // T → R → S → P
    const IVP = Mat3Math.inverse(VP);

    // パディング込みで詰める
    const data = new Float32Array(12 * 2 + 2); // 4*3
    data[0] = VP[0];
    data[1] = VP[1];
    data[2] = VP[2];
    data[3] = 0; // pad
    data[4] = VP[3];
    data[5] = VP[4];
    data[6] = VP[5];
    data[7] = 0; // pad
    data[8] = VP[6];
    data[9] = VP[7];
    data[10] = VP[8];
    data[11] = 0; // pad

    data[12] = IVP[0];
    data[13] = IVP[1];
    data[14] = IVP[2];
    data[15] = 0; // pad
    data[16] = IVP[3];
    data[17] = IVP[4];
    data[18] = IVP[5];
    data[19] = 0; // pad
    data[20] = IVP[6];
    data[21] = IVP[7];
    data[22] = IVP[8];
    data[23] = 0; // pad

    data[24] = 2 / width;
    data[25] = 2 / height;

    simpleWebGPU.writeBuffer(this.cameraBuffer, data);
    // simpleWebGPU.writeBuffer(
    //   this.cameraBuffer,
    //   simpleWebGPU.createBitData(VP, ["f32"]),
    // );
  }
}
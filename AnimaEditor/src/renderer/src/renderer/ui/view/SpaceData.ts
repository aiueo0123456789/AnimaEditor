import { Runtime_Armature } from "../../../core/projectCache/runtime/Armature";
import { Runtime_Sprite } from "../../../core/projectCache/runtime/Sprite";
import { ID } from "../../../editor/Editor";
import { ArmatureState } from "../../../editor/editorState/state/Armature";
import { simpleWebGPU } from "../../../util/simpleWebGPU";
import { Mat3Math, Vec2Math } from "../../../util/vecMath";
import { View_Camera } from "./Camera";
import { View_ArmatureRenderData } from "./renderData/ArmatureRenderData";
import { View_SpriteRenderData } from "./renderData/SpriteRenderData";

export class View_SceneConfigRenderData {
  public buffer: GPUBuffer;
  constructor() {
    this.buffer = simpleWebGPU.createBuffer(4 * 4, ["U"]);
  }
}

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

export class GizumoRenderData {
  public settingBuffer: GPUBuffer;
  public vertexSize: number;
  public boneSize: number;
  constructor() {
    /**
     * vertexSize: f32,
     * boneSize: f32,
     */
    this.settingBuffer = simpleWebGPU.createBuffer((1 + 1) * 4, ["U"]);

    this.vertexSize = 10;
    this.boneSize = 10;
  }
}

type ViewRenderDatas = View_SpriteRenderData | View_ArmatureRenderData;

export class UIComponent_View_SpaceData {
  private renderData: Map<ID, ViewRenderDatas>;
  private IDtoNumber: Map<ID, number>;
  public cameraRenderData: CameraRenderData;
  public gizumoRenderData: GizumoRenderData;
  constructor() {
    this.IDtoNumber = new Map();
    this.renderData = new Map();
    this.cameraRenderData = new CameraRenderData();

    this.gizumoRenderData = new GizumoRenderData();
  }

  private getFreeNumber(): number {
    const used = new Set(this.IDtoNumber.values());
    let id = 0;
    while (used.has(id)) {
      id++;
    }
    return id;
  }

  addSpriteRenderData(sprite: Runtime_Sprite): View_SpriteRenderData {
    const numberID = this.getFreeNumber();
    const spriteRenderData = new View_SpriteRenderData(numberID);
    this.renderData.set(sprite.id, spriteRenderData);
    this.IDtoNumber.set(sprite.id, numberID);
    return spriteRenderData;
  }

  addArmatureRenderData(armature: Runtime_Armature): View_ArmatureRenderData {
    const numberID = this.getFreeNumber();
    const armatureRenderData = new View_ArmatureRenderData(numberID);
    this.renderData.set(armature.id, armatureRenderData);
    this.IDtoNumber.set(armature.id, numberID);
    return armatureRenderData;
  }

  getRenderData(id: ID): ViewRenderDatas | null {
    return this.renderData.get(id) ?? null;
  }

  numberIDtoID(numberID: number): ID {
    for (const [id, nid] of this.IDtoNumber.entries()) {
      if (numberID === nid) return id;
    }
    return "";
  }
}

import { simpleWebGPU } from "../../../util/simpleWebGPU";
import { Model_Texture } from "../../project/model/Texture";
import { Runtime } from "../Runtime";

export class Runtime_Texture extends Runtime {
  public texture: GPUTexture;
  public model: Model_Texture;
  public hasUpdate: boolean;

  constructor(model: Model_Texture) {
    super(model);
    this.model = model;
    this.texture = simpleWebGPU.createTexture2D([1, 1]);

    this.hasUpdate = true;
  }
}

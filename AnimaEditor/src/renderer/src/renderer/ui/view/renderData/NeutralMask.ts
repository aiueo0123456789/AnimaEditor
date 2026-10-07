import { simpleWebGPU } from "../../../../util/simpleWebGPU";

export function createNeutralMask(): GPUTexture {
  const texture = simpleWebGPU.createTexture2D([1, 1]);
  simpleWebGPU.device.queue.writeTexture({ texture }, new Uint8Array([255, 255, 255, 255]), { bytesPerRow: 4 }, [1, 1]);
  return texture;
}

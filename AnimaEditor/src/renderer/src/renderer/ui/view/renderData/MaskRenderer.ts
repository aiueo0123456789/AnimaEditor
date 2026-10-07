import type { Runtime_Sprite } from "../../../../core/projectCache/runtime/Sprite";
import type { Runtime_SceneConfig } from "../../../../core/projectCache/configRuntime/Scene";
import { simpleWebGPU } from "../../../../util/simpleWebGPU";
import { createNeutralMask } from "./NeutralMask";

export interface MaskGeometry {
  vertices: GPUBuffer;
  texcoords: GPUBuffer;
  indices: GPUBuffer;
  params: GPUBuffer;
}

const pipelines = new WeakMap<GPUDevice, GPURenderPipeline>();
const debugPipelines = new WeakMap<GPUDevice, GPURenderPipeline>();
function maskPipeline(): GPURenderPipeline {
  const device = simpleWebGPU.device;
  let pipeline = pipelines.get(device);
  if (pipeline) return pipeline;
  const module = device.createShaderModule({ code: `
    struct Camera { vp: mat3x3<f32>, inverseVP: mat3x3<f32>, pixelSize: vec2<f32> }
    struct Params { alpha: f32 }
    @group(0) @binding(0) var<uniform> camera: Camera;
    @group(0) @binding(1) var<uniform> params: Params;
    @group(0) @binding(2) var image: texture_2d<f32>;
    @group(0) @binding(3) var imageSampler: sampler;
    struct Output { @builtin(position) position: vec4<f32>, @location(0) uv: vec2<f32> }
    @vertex fn vertex(@location(0) position: vec2<f32>, @location(1) uv: vec2<f32>) -> Output {
      var result: Output;
      result.position = vec4<f32>(camera.vp * vec3<f32>(position, 1.0), 1.0);
      result.uv = uv;
      return result;
    }
    @fragment fn fragment(input: Output) -> @location(0) vec4<f32> {
      if (any(input.uv < vec2<f32>(0.0)) || any(input.uv > vec2<f32>(1.0))) { discard; }
      let coverage = textureSample(image, imageSampler, input.uv).a * params.alpha;
      return vec4<f32>(1.0, 0.0, 0.0, coverage);
    }
  ` });
  pipeline = device.createRenderPipeline({
    layout: "auto", vertex: { module, entryPoint: "vertex", buffers: [0, 1].map(shaderLocation => ({
      arrayStride: 8, attributes: [{ shaderLocation, offset: 0, format: "float32x2" as const }],
    })) },
    fragment: { module, entryPoint: "fragment", targets: [{ format: "rgba8unorm", blend: {
      color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
      alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
    } }] }, primitive: { topology: "triangle-list" },
  });
  pipelines.set(device, pipeline);
  return pipeline;
}

function debugPipeline(): GPURenderPipeline {
  const device = simpleWebGPU.device;
  let pipeline = debugPipelines.get(device);
  if (pipeline) return pipeline;
  const module = device.createShaderModule({ code: `
    @group(0) @binding(0) var maskTexture: texture_2d<f32>;
    @vertex fn vertex(@builtin(vertex_index) index: u32) -> @builtin(position) vec4<f32> {
      let points = array<vec2<f32>, 3>(vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
      return vec4<f32>(points[index], 0.0, 1.0);
    }
    @fragment fn fragment(@builtin(position) position: vec4<f32>) -> @location(0) vec4<f32> {
      let coverage = textureLoad(maskTexture, vec2<i32>(position.xy), 0).r;
      return vec4<f32>(1.0, 0.0, 0.0, coverage * 0.35);
    }
  ` });
  pipeline = device.createRenderPipeline({ layout: "auto", vertex: { module, entryPoint: "vertex" },
    fragment: { module, entryPoint: "fragment", targets: [{ format: simpleWebGPU.preferredCanvasFormat, blend: {
      color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
      alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
    } }] }, primitive: { topology: "triangle-list" },
  });
  debugPipelines.set(device, pipeline);
  return pipeline;
}

// Relationships are derived from Sprite references only, never stored on Mask.
export class MaskRenderer {
  private textures = new Map<string, GPUTexture>();
  private neutral: GPUTexture | null = null;

  private retainMasks(masks: Runtime_SceneConfig.Mask[]): void {
    const ids = new Set(masks.map(mask => mask.id));
    for (const [id, texture] of this.textures) {
      if (ids.has(id)) continue;
      texture.destroy();
      this.textures.delete(id);
    }
  }

  textureFor(sprite: Runtime_Sprite): GPUTexture {
    const mask = sprite.maskSource.mask;
    return (mask && this.textures.get(mask.id)) || (this.neutral ??= createNeutralMask());
  }

  render(encoder: GPUCommandEncoder, masks: Runtime_SceneConfig.Mask[], sprites: Runtime_Sprite[],
    camera: GPUBuffer, width: number, height: number, geometry: (sprite: Runtime_Sprite) => MaskGeometry | null): void {
    this.retainMasks(masks);
    for (const [id, texture] of this.textures) {
      if (texture.width !== width || texture.height !== height) {
        texture.destroy();
        this.textures.delete(id);
      }
    }
    for (const mask of masks) {
      let texture = this.textures.get(mask.id);
      if (!texture) {
        texture = simpleWebGPU.device.createTexture({ label: `mask:${mask.id}`, size: [width, height], format: "rgba8unorm",
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT });
        this.textures.set(mask.id, texture);
      }
      const pass = encoder.beginRenderPass({ colorAttachments: [{ view: texture.createView(),
        clearValue: [0, 0, 0, 0], loadOp: "clear", storeOp: "store" }] });
      const pipeline = maskPipeline();
      pass.setPipeline(pipeline);
      for (const sprite of sprites) {
        if (!sprite.maskTarget.some(reference => reference.mask === mask)) continue;
        const data = geometry(sprite);
        if (!data || !sprite.texture?.texture || !sprite.indicesNum) continue;
        pass.setBindGroup(0, simpleWebGPU.device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [
          { binding: 0, resource: { buffer: camera } },
          { binding: 1, resource: { buffer: data.params } },
          { binding: 2, resource: sprite.texture.texture.createView() },
          { binding: 3, resource: simpleWebGPU.sampler },
        ] }));
        pass.setVertexBuffer(0, data.vertices);
        pass.setVertexBuffer(1, data.texcoords);
        pass.setIndexBuffer(data.indices, "uint32");
        pass.drawIndexed(sprite.indicesNum * 3);
      }
      pass.end();
    }
  }

  drawDebug(pass: GPURenderPassEncoder, maskID: string): void {
    const texture = this.textures.get(maskID);
    if (!texture) return;
    const pipeline = debugPipeline();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, simpleWebGPU.device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [
      { binding: 0, resource: texture.createView() },
    ] }));
    pass.draw(3);
  }

  dispose(): void {
    for (const texture of this.textures.values()) texture.destroy();
    this.textures.clear();
    this.neutral?.destroy();
    this.neutral = null;
  }
}

export function spriteMaskParams(sprite: Runtime_Sprite): BufferSource {
  const mask = sprite.maskSource.mask;
  return simpleWebGPU.createBitData([sprite.alpha, mask ? sprite.maskType : 2, mask?.strength ?? 0, 0], ["f32", "u32", "f32", "f32"]) as BufferSource;
}

import { contoursFromMasks, validateOptions, type ContourOptions, type ContourResult, type ContourRequest, type ContourResponse } from './thread'
import type { Vec2, Vec3 } from '../../util/vecMath'
export type { ContourOptions, ContourResult } from './thread'
import { cutSilhouetteOutTriangle as filterTriangles } from '../CDT/createMesh'

export function cutSilhouetteOutTriangle(vertices: Vec2[], meshes: Vec3[], edges: Vec2[]): Vec3[] {
  return filterTriangles(vertices, meshes, edges, true)
}

const pipelines = new WeakMap<GPUDevice, Promise<GPUComputePipeline>>()
const shader = `
@group(0) @binding(0) var<storage, read_write> outputData: array<u32>;
@group(0) @binding(1) var inputTexture: texture_2d<f32>;
fn sampleValue(p: vec2<i32>, size: vec2<i32>) -> u32 {
  if (any(p < vec2<i32>(0)) || any(p >= size)) { return 0u; }
  return select(0u, 1u, textureLoad(inputTexture, p, 0).a > 0.05);
}
@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let size = vec2<i32>(textureDimensions(inputTexture));
  if (any(id.xy > vec2<u32>(size))) { return; }
  let p = vec2<i32>(id.xy) - vec2<i32>(1);
  outputData[id.x + id.y * u32(size.x + 1)] =
    (sampleValue(p + vec2<i32>(0, 1), size) << 3u) |
    (sampleValue(p + vec2<i32>(1, 1), size) << 2u) |
    (sampleValue(p + vec2<i32>(1, 0), size) << 1u) |
    sampleValue(p, size);
}`

function getPipeline(device: GPUDevice): Promise<GPUComputePipeline> {
  let pipeline = pipelines.get(device)
  if (!pipeline) {
    // No GPU or worker creation at module import time.
    pipeline = device.createComputePipelineAsync({
      layout: 'auto',
      compute: { module: device.createShaderModule({ code: shader }), entryPoint: 'main' }
    })
    pipelines.set(device, pipeline)
    pipeline.catch(() => pipelines.delete(device))
  }
  return pipeline
}

function checkAbort(signal?: AbortSignal): void {
  if (signal?.aborted) throw signal.reason ?? new DOMException('Aborted', 'AbortError')
}

function processContours(masks: Uint32Array<ArrayBuffer>, width: number, height: number, options: ContourOptions, signal?: AbortSignal): Promise<ContourResult> {
  checkAbort(signal)
  if (typeof Worker === 'undefined') return Promise.resolve(contoursFromMasks(masks, width, height, options))
  return new Promise<ContourResult>((resolve, reject) => {
    const worker = new Worker(new URL('./thread.ts', import.meta.url), { type: 'module' })
    const finish = (response: ContourResponse): void => {
      signal?.removeEventListener('abort', abort)
      worker.terminate()
      if ('error' in response) reject(new Error(response.error))
      else resolve(response.result)
    }
    const abort = (): void => {
      signal?.removeEventListener('abort', abort)
      worker.terminate()
      reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'))
    }
    worker.onmessage = (event: MessageEvent<ContourResponse>) => finish(event.data)
    worker.onerror = event => { event.preventDefault(); finish({ error: event.message || 'Contour worker failed' }) }
    worker.onmessageerror = () => finish({ error: 'Invalid contour worker response' })
    signal?.addEventListener('abort', abort, { once: true })
    try {
      checkAbort(signal)
      const request: ContourRequest = { masks, width, height, options }
      worker.postMessage(request, [masks.buffer])
    } catch (error) {
      signal?.removeEventListener('abort', abort)
      worker.terminate()
      reject(error)
    }
  })
}

/**
 * Alpha > 0.05 is opaque. Density is pixels per editor unit.
 * Padding and simplification epsilon are in editor units. Both origins use Y-up;
 * Returns only vertex positions and edge indices; the Sprite computes its own UVs.
 * Returns every closed contour, including disconnected islands and holes.
 * Requires a single-layer, single-sample float-sampled 2D texture with TEXTURE_BINDING.
 */
export async function createEdgeFromTexture(
  texture: GPUTexture, pixelDensity = 1, padding = 0, simplEpsilon = 5,
  option: ContourOptions['option'] = 'center', { signal }: { signal?: AbortSignal } = {}
): Promise<ContourResult> {
  const options = { pixelDensity, padding, simplEpsilon, option }
  validateOptions(options)
  checkAbort(signal)
  const { simpleWebGPU } = await import('../../util/simpleWebGPU')
  const device = simpleWebGPU.device
  const { width, height } = texture
  if (texture.dimension !== '2d' || texture.depthOrArrayLayers !== 1 || texture.sampleCount !== 1 ||
      !(texture.usage & GPUTextureUsage.TEXTURE_BINDING)) throw new TypeError('Expected a sampleable single-layer 2D texture')
  if (!/^(rgba8unorm|rgba8unorm-srgb|bgra8unorm|bgra8unorm-srgb|rgba16float)$/.test(texture.format)) {
    throw new TypeError('Unsupported texture format: ' + texture.format)
  }
  const size = (width + 1) * (height + 1) * 4
  if (!Number.isSafeInteger(size) || size > device.limits.maxStorageBufferBindingSize || size > device.limits.maxBufferSize) {
    throw new RangeError('Texture contour grid exceeds GPU buffer limits')
  }
  const pipeline = await getPipeline(device)
  checkAbort(signal)
  let output: GPUBuffer | undefined, readback: GPUBuffer | undefined
  let masks: Uint32Array<ArrayBuffer>
  try {
    output = simpleWebGPU.createBuffer(size, ['S'])
    readback = simpleWebGPU.createBuffer(size, GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ)
    const encoder = device.createCommandEncoder()
    const pass = encoder.beginComputePass()
    pass.setPipeline(pipeline)
    pass.setBindGroup(0, simpleWebGPU.createGroup(pipeline.getBindGroupLayout(0), [output, texture.createView()]))
    pass.dispatchWorkgroups(Math.ceil((width + 1) / 16), Math.ceil((height + 1) / 16))
    pass.end()
    encoder.copyBufferToBuffer(output, 0, readback, 0, size)
    device.queue.submit([encoder.finish()])
    await readback.mapAsync(GPUMapMode.READ)
    checkAbort(signal)
    masks = new Uint32Array(readback.getMappedRange()).slice()
  } finally {
    // destroy also unmaps; failures and device loss must not leak temporary buffers.
    readback?.destroy()
    output?.destroy()
  }
  return processContours(masks, width, height, options, signal)
}

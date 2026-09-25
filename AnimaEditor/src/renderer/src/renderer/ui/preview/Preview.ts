import { Runtime_Sprite } from "../../../core/projectCache/runtime/Sprite";
import { AnimaEditor } from "../../../editor/Editor";
import { PipelineManager } from "../../../manager/PipelineManager";
import { UIManager } from "../../../manager/ui/UIManager";
import { Canvas, Column, Header, Main, Text } from "../../../manager/ui/components";
import type { WidgetHandle } from "../../../manager/ui/WidgetTree";
import { simpleWebGPU } from "../../../util/simpleWebGPU";
import { UIComponent } from "../UI";
import { View_Camera } from "../view/Camera";
import { UIComponent_Preview_SpaceData } from "./SpaceData";
import { InputManager } from "../../../manager/InputManager";
import { Vec2, Vec2Math } from "../../../util/vecMath";
import { CameraRenderData } from "../view/renderData/CameraRenderData";

// Preview owns only scene geometry, never selection or editing-overlay buffers.
class PreviewSpriteData {
  private buffers = new Map<string, GPUBuffer>();

  upload(key: string, values: Float32Array<ArrayBuffer> | Uint32Array<ArrayBuffer>, index = false): GPUBuffer {
    let buffer = this.buffers.get(key);
    const size = Math.max(32, values.byteLength);
    if (buffer?.size !== size) {
      buffer?.destroy();
      buffer = simpleWebGPU.createBuffer(size, index ? ["I"] : ["V"]);
      this.buffers.set(key, buffer);
    }
    simpleWebGPU.writeBuffer(buffer!, values);
    return buffer!;
  }

  dispose(): void {
    for (const buffer of this.buffers.values()) buffer.destroy();
    this.buffers.clear();
  }
}

export class UIComponent_Preview extends UIComponent {
  public name = "Preview";
  private handle: WidgetHandle | null = null;
  private host: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private canvasBBox: DOMRect | null = null;
  private context: GPUCanvasContext | null = null;
  private cameraData: CameraRenderData | null = null;
  private camera: View_Camera = new View_Camera();
  private readonly sprites = new Map<string, PreviewSpriteData>();

  constructor(public readonly spaceData = new UIComponent_Preview_SpaceData()) { super({ id: 0, name: "Preview", icon: "" }); }


  public clientVecToWorldVec(vec: Vec2): Vec2 {
    return Vec2Math.div(vec, Vec2Math.create(this.camera.zoom, -this.camera.zoom));
  }

  public clientToScreen(clientPosition: Vec2): Vec2 {
    if (!this.canvasBBox) return Vec2Math.copy(clientPosition);
    return Vec2Math.div(
      Vec2Math.flipY(
        Vec2Math.sub(clientPosition, Vec2Math.create(this.canvasBBox.left, this.canvasBBox.top)),
        this.canvasBBox.height,
      ),
      Vec2Math.create(this.canvasBBox.width, this.canvasBBox.height),
    );
  }

  public screenToWorld(screenPosition: Vec2): Vec2 {
    if (!this.canvasBBox) return Vec2Math.create();
    return Vec2Math.add(
      Vec2Math.mul(
        Vec2Math.div(
          Vec2Math.sub(screenPosition, Vec2Math.create(0.5, 0.5)),
          Vec2Math.create(this.camera.zoom, this.camera.zoom),
        ),
        Vec2Math.create(this.canvasBBox.width, this.canvasBBox.height),
      ),
      this.camera.position,
    );
  }

  // 画面上の座標からビューないのワールド座標へ
  public clientToWorld(clientPosition: Vec2): Vec2 {
    if (!this.canvas) return Vec2Math.create();
    return this.screenToWorld(this.clientToScreen(clientPosition));
  }

  public override input(editor: AnimaEditor): void { this.processInput(editor); }

  private processInput(editor: AnimaEditor): void {
    const input = editor.getManager(InputManager);
    if (!input || !this.canvas) return;
    this.canvasBBox = this.canvas.getBoundingClientRect();
    if (!this.canvasBBox) return;
    if (input.getKey("ControlLeft") || input.getKey("ControlRight")) {
      this.camera.zoom = Math.max(.05, Math.min(100, this.camera.zoom * Math.exp(-input.mouseScrollDelta[1] * .01)));
    } else {
      Vec2Math.sub(this.camera.position, Vec2Math.mul(this.clientVecToWorldVec(input.mouseScrollDelta), [1, -1]), this.camera.position);
    }
  }

  private release(): void {
    this.context?.unconfigure();
    this.context = null;
    this.canvas = null;
    this.cameraData?.cameraBuffer.destroy();
    this.cameraData = null;
    for (const data of this.sprites.values()) data.dispose();
    this.sprites.clear();
  }

  public override dispose(editor: AnimaEditor): void {
    const handle = this.handle;
    this.handle = null;
    if (handle) editor.getManager(UIManager)?.disposeWidget(handle);
    this.release();
    this.host = null;
  }

  private mountCanvas(canvas: HTMLCanvasElement): () => void {
    this.canvas = canvas;
    this.context = canvas.getContext("webgpu");
    this.context?.configure({ device: simpleWebGPU.device, format: simpleWebGPU.preferredCanvasFormat });
    this.cameraData = new CameraRenderData();
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const limit = simpleWebGPU.device.limits.maxTextureDimension2D;
      const width = Math.min(limit, Math.max(1, Math.round(rect.width * devicePixelRatio)));
      const height = Math.min(limit, Math.max(1, Math.round(rect.height * devicePixelRatio)));
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    return () => { observer.disconnect(); this.release(); };
  }

  public override update(editor: AnimaEditor, parent: HTMLElement): void {
    const ui = editor.getManager(UIManager);
    if (!ui) return;
    if (this.host !== parent || !this.handle) {
      this.dispose(editor);
      this.handle = ui.mountWidget(parent, Column({ className: "ui-panel ui-preview", children: [
        Header({ children: [Text({ text: "Preview" })] }),
        Main({ className: "ui-preview-main", padding: 0, overflow: "hidden", children: [
          Canvas({ className: "ui-preview-canvas", label: "Sprite preview", onMount: canvas => this.mountCanvas(canvas) }),
        ] }),
      ] }));
      this.host = parent;
    }
    const sprites = editor.projectCache.getRuntimesByType(Runtime_Sprite);
    const ids = new Set(sprites.map(sprite => sprite.id));
    for (const [id, data] of this.sprites) if (!ids.has(id)) {
      data.dispose();
      this.sprites.delete(id);
    }
    const rect = this.canvas?.getBoundingClientRect();
    if (!rect?.width || !rect.height || !this.context || !this.cameraData) return;
    this.cameraData.update(this.camera, rect.width, rect.height);
    const encoder = simpleWebGPU.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({ colorAttachments: [{
      view: this.context.getCurrentTexture().createView(),
      clearValue: [1, 1, 1, 1], loadOp: "clear", storeOp: "store",
    }] });
    const pipeline = editor.getManager(PipelineManager)?.getPipelineByID("Scene-Sprite");
    if (pipeline) for (const sprite of [...sprites].sort((a, b) => a.zIndex - b.zIndex)) {
      if (!sprite.texture?.texture || !sprite.indicesNum) continue;
      let data = this.sprites.get(sprite.id);
      if (!data) this.sprites.set(sprite.id, data = new PreviewSpriteData());
      const vertices = data.upload("vertices", new Float32Array(sprite.vertices.flat()));
      const texcoords = data.upload("texcoords", new Float32Array(sprite.texcoords.flat()));
      const indices = data.upload("indices", new Uint32Array(sprite.indices.flat()), true);
      pass.setPipeline(pipeline.pipeline);
      for (const attribute of pipeline.vertexBuffers) {
        if (attribute.source === "VERTEX") pass.setVertexBuffer(attribute.location, vertices);
        if (attribute.source === "TEXCOORD") pass.setVertexBuffer(attribute.location, texcoords);
      }
      pass.setBindGroup(0, simpleWebGPU.createGroup(pipeline.groupLayout, [
        this.cameraData.cameraBuffer, sprite.texture.texture, simpleWebGPU.sampler,
      ]));
      pass.setIndexBuffer(indices, "uint32");
      pass.drawIndexed(sprite.indicesNum * 3);
    }
    pass.end();
    simpleWebGPU.device.queue.submit([encoder.finish()]);
  }
}

import { Runtime_Armature } from "../../../core/projectCache/runtime/Armature";
import { Runtime_Sprite } from "../../../core/projectCache/runtime/Sprite";
import { AnimaEditor } from "../../../editor/Editor";
import { InputManager } from "../../../manager/InputManager";
import { PipelineManager } from "../../../manager/PipelineManager";
import { simpleWebGPU } from "../../../util/simpleWebGPU";
import { Vec2, Vec2Math } from "../../../util/vecMath";
import { UIComponent } from "../UI";
import { View_Camera } from "./Camera";
import { UIComponent_View_SpaceData } from "./SpaceData";
import { CommandManager } from "../../../manager/CommandManager";
import { SpriteState } from "../../../editor/editorState/state/States/Sprite";
import { ArmatureState } from "../../../editor/editorState/state/States/Armature";
import { View_ArmatureRenderData } from "./renderData/ArmatureRenderData";
import { View_SpriteRenderData } from "./renderData/SpriteRenderData";
import { UIManager } from "../../../manager/ui/UIManager";
import type { WidgetHandle } from "../../../manager/ui/WidgetTree";
import { bind, Button, Canvas, Checkbox, Column, Container, Header, Main, Select, ContextMenu, Submenu } from "../../../manager/ui/components";
import type { ContextMenuWidget, Widget } from "../../../manager/ui/components";
import { CameraRenderData } from "./renderData/CameraRenderData";
import { MaskRenderer } from "./renderData/MaskRenderer";
import { EditorEvent, EditorEventType } from "../../../manager/EventManager";
import { ViewEditModes } from "../../../editor/editorState/ViewEditModes";
import { SetEditModeCommand } from "../../../editor/command/interactionCommand/SetEditModeCommand";
import { geometrySource } from "./ViewGeometry";
import { addViewObject } from "./ViewContext";

export class View_RenderData {
  public masks = new MaskRenderer();
  public cameraRenderData = new CameraRenderData();

  dispose() {
    this.masks.dispose();
    this.cameraRenderData.cameraBuffer.destroy();
  }
}

let counter = 0;
export class UIComponent_View extends UIComponent {
  public showReferenceGeometry = false;
  public debugMaskID = "";
  private handle: WidgetHandle | null = null;
  private host: HTMLElement | null = null;
  private gesture = false;
  private hovering = false;
  private toolbarHandle: WidgetHandle | null = null;
  private toolbarSignature = "";
  private paramsHandle: WidgetHandle | null = null;
  private paramsHost: HTMLElement | null = null;
  private paramsSignature = "";

  private availableToolIDs(editor: AnimaEditor): string[] {
    return this.spaceData.modeToToolMap[editor.editorState.editMode] ?? [];
  }

  private syncTool(editor: AnimaEditor): void {
    this.toolManager.syncMode(editor.editorState.editMode, this.availableToolIDs(editor));
  }

  private buildToolbar(editor: AnimaEditor): Widget {
    return this.toolManager.createToolbarWidget(this.availableToolIDs(editor));
  }

  private _renderData: View_RenderData | null = new View_RenderData();
  get renderData(): View_RenderData {
    if (!(this._renderData instanceof View_RenderData)) this._renderData = new View_RenderData();
    return this._renderData;
  }

  public override dispose(editor: AnimaEditor): void {
    this.toolManager.releaseView(this);
    if (this.handle) editor.getManager(UIManager)?.disposeWidget(this.handle);
    this.handle = null;
    this.toolbarHandle = null;
    this.paramsHandle = null;
    this.paramsHost = null;
    this.host = null;
    this.spaceData.renderData.release(this);
    this._renderData?.dispose();
    this._renderData = null;
    for (const buffer of this.uniforms.values()) buffer.destroy();
    this.uniforms.clear();
  }
  private readonly uniforms = new Map<string, GPUBuffer>();
  private uniform(values: number[]): GPUBuffer {
    const key = values.join(",");
    let buffer = this.uniforms.get(key);
    if (!buffer) {
      buffer = simpleWebGPU.createBuffer(values.length * 4, ["U"], new Float32Array(values));
      this.uniforms.set(key, buffer);
    }
    return buffer;
  }
  public camera: View_Camera = new View_Camera();
  public canvas: HTMLCanvasElement | null = null;
  public canvasBBox: DOMRect | null = null;
  public canvasContext: any = null;
  public get currentTool(): string { return this.toolManager.activeToolID; }
  public set currentTool(value: string) { this.toolManager.activate(value); }
  public get toolManager() { return this.spaceData.toolManager; }
  public objectIDTexture: GPUTexture | null = null;
  public objectIDTextureView: GPUTextureView | null = null;

  constructor(public readonly spaceData = new UIComponent_View_SpaceData()) {
    super({ name: "View", id: counter, icon: "eye" });
    counter++;
  }

  private contextMenu(editor: AnimaEditor, event: MouseEvent): ContextMenuWidget {
    const position = this.clientToWorld([event.clientX, event.clientY]);
    const boneLength = 100 / Math.max(.05, this.camera.zoom);
    const children = [
        Button({ label: "削除", onPress: () => {} }),
        Submenu({
          label: "オブジェクト追加",
          children: [
            Button({ label: "スプライト", onPress: () => { addViewObject(editor, "sprite", position); } }),
            Button({ label: "アーマチュア", onPress: () => { addViewObject(editor, "armature", position, boneLength); } }),
            Button({ label: "アニメーション", onPress: () => { addViewObject(editor, "animation", position); } }),
            // Button({ label: "テクスチャ", onPress: () => {} }),
          ],
        }),
      ];
    return editor.getManager(UIManager)?.panelContextMenu(this, children) ?? ContextMenu({ children });
  }

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
    this.syncTool(editor);
    const input = editor.getManager(InputManager);
    if (!input || !this.canvas) return;
    this.canvasBBox = this.canvas.getBoundingClientRect();
    if (this.gesture) {
      this.toolManager.update({ editor, view: this });
      if (input.getKeyUp("Mouse0") || !input.getKey("Mouse0")) this.gesture = false;
    }
    if (!this.hovering || document.activeElement !== this.canvas) return;
    if (this.gesture) return;
    if (input.getKey("AltLeft") || input.getKey("AltRight")) {
      this.camera.zoom = Math.max(.05, Math.min(100, this.camera.zoom * Math.exp(-input.mouseScrollDelta[1] * .01)));
    } else {
      Vec2Math.sub(this.camera.position, Vec2Math.mul(this.clientVecToWorldVec(input.mouseScrollDelta), [1, -1]), this.camera.position);
    }
  }

  private mountCanvas(editor: AnimaEditor, canvas: HTMLCanvasElement): () => void {
    this.canvas = canvas;
    const controller = new AbortController();
    const signal = controller.signal;
    this.canvasContext = canvas.getContext("webgpu");
    this.canvasContext?.configure({ device: simpleWebGPU.device, format: simpleWebGPU.preferredCanvasFormat });
    const resize = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * scale));
      canvas.height = Math.max(1, Math.round(rect.height * scale));
      this.canvasBBox = rect;
      this.updateObjectIDTexture();
    });
    resize.observe(canvas);
    canvas.addEventListener("pointerdown", event => {
      if (event.button !== 0) return;
      canvas.focus({ preventScroll: true });
      this.gesture = true;
      canvas.setPointerCapture(event.pointerId);
    }, { signal });
    canvas.addEventListener("pointerenter", () => { this.hovering = true; }, { signal });
    canvas.addEventListener("pointerleave", () => { this.hovering = false; }, { signal });
    const cancel = (): void => { this.gesture = false; this.toolManager.cancelInput(this); };
    canvas.addEventListener("pointercancel", cancel, { signal });
    window.addEventListener("blur", cancel, { signal });
    canvas.addEventListener("contextmenu", event => event.preventDefault(), { signal });
    canvas.addEventListener("wheel", event => { canvas.focus({ preventScroll: true }); event.preventDefault(); }, { signal, passive: false });
    canvas.addEventListener("keydown", event => {
      if (event.code === "KeyZ" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (this.gesture && !editor.getManager(InputManager)?.getKey("Mouse0")) this.processInput(editor);
        cancel();
        const manager = editor.getManager(CommandManager);
        if (event.shiftKey) manager?.redo(); else manager?.undo();
      }
      if (event.code === "Escape") cancel();
    }, { signal });
    return () => {
      cancel();
      controller.abort();
      resize.disconnect();
      this.canvasContext?.unconfigure();
      this.canvasContext = null;
      this.objectIDTexture?.destroy();
      this.objectIDTexture = null;
      this.objectIDTextureView = null;
      this.canvas = null;
      this.canvasBBox = null;
      this.hovering = false;
    };
  }

  private updateObjectIDTexture(): void {
    if (this.canvas) {
      this.objectIDTexture?.destroy();
      this.objectIDTexture = simpleWebGPU.createTexture2D(
        [Math.max(1, this.canvas.clientWidth), Math.max(1, this.canvas.clientHeight)],
        "r32uint",
      );
      this.objectIDTextureView = this.objectIDTexture.createView();
    }
  }

  public override update(editor: AnimaEditor, parent: HTMLElement): void {
    const pipelineManager = editor.getManager(PipelineManager);
    if (!pipelineManager) return ;
    const ui = editor.getManager(UIManager);
    if (!ui) return;
    if (this.host !== parent || !this.handle) {
      this.dispose(editor);
      const modeChange = (): Widget => Select({
        label: "編集モード",
        observeEvents: [
          new EditorEvent(EditorEventType.change, editor, "project"),
          new EditorEvent(EditorEventType.change, editor.editorState, "editMode"),
          new EditorEvent(EditorEventType.change, editor.editorState, "objects"),
        ],
        value: bind({ read: () => editor.editorState.editMode }),
        options: editor.editorState.getModelStateByID(editor.editorState.activeObject?.id ?? "")?.availableModes.map(mode => ({ value: mode, label: mode })) ?? [{value: ViewEditModes.OBJECT, label: ViewEditModes.OBJECT}],
        onChange: value => {
          if (value && Object.values(ViewEditModes).includes(value as ViewEditModes)) {
            if (value === editor.editorState.editMode) return;
            const commands = editor.getManager(CommandManager);
            if (!commands || commands.commandRecorder) return;
            const recorder = commands.setCommandRecorder("Change edit mode");
            if (!recorder) return;
            recorder.setCommand(SetEditModeCommand, { editMode: value as ViewEditModes });
            if (!recorder.command) { commands.cancelCommandRecorder(); return; }
            recorder.commitCommand();
            commands.commitCommandRecorder();
            this.syncTool(editor);
          }
        },
        rebuild: modeChange,
      });
      const debugMask = (): Widget => Select({
        label: "マスク表示",
        observeEvents: [
          new EditorEvent(EditorEventType.change, editor, "project"),
          new EditorEvent(EditorEventType.change, editor.project.sceneConfig, "masks"),
          new EditorEvent(EditorEventType.add, editor.project.sceneConfig, "masks"),
          new EditorEvent(EditorEventType.delete, editor.project.sceneConfig, "masks"),
        ],
        rebuild: debugMask,
        value: bind({ read: () => this.debugMaskID }),
        options: [{ value: "", label: "なし" }, ...Object.entries(editor.project.sceneConfig.masks)
          .map(([id, mask]) => ({ value: id, label: mask.name }))],
        onChange: value => {
          this.debugMaskID = value ?? "";
          if (this.handle) ui.invalidateWidget(this.handle);
        },
      });
      this.handle = ui.mountWidget(parent, Column({ className: "ui-panel ui-view", contextMenu: event => this.contextMenu(editor, event), children: [
        Header({ gap: 8, children: [
          modeChange(),
          debugMask(),
          Checkbox({ label: "比較表示", value: bind({ read: () => this.showReferenceGeometry }),
            onChange: value => { this.showReferenceGeometry = value; } }),
        ] }),
        Main({ className: "ui-view-main", padding: 0, overflow: "hidden", children: [
          Canvas({ className: "ui-view-canvas", label: "Animation viewport", onMount: canvas => this.mountCanvas(editor, canvas) }),
          Container({ className: "ui-view-toolbar", onMount: element => {
            const handle = ui.mountWidget(element, this.buildToolbar(editor));
            this.toolbarHandle = handle;
            this.toolbarSignature = "";
            return () => { ui.disposeWidget(handle); this.toolbarHandle = null; };
          } }),
          Container({ className: "ui-view-tool-params-host", overflow: "auto", onMount: element => {
            const params = this.toolManager.createParamsWidget(editor);
            element.hidden = !params;
            const handle = ui.mountWidget(element, params ?? Container({}));
            this.paramsHost = element;
            this.paramsHandle = handle;
            this.paramsSignature = "";
            return () => {
              ui.disposeWidget(handle);
              this.paramsHandle = null;
              this.paramsHost = null;
            };
          } }),
        ] }),
      ] }));
      this.host = parent;
      this.spaceData.renderData.acquire(this);
    }
    this.syncTool(editor);
    const signature = JSON.stringify([editor.editorState.editMode, this.availableToolIDs(editor), this.toolManager.version]);
    if (this.toolbarHandle) {
      if (signature !== this.toolbarSignature) ui.resetWidget(this.toolbarHandle, this.buildToolbar(editor));
      this.toolbarSignature = signature;
    }
    const activeTool = this.toolManager.activeTool;
    const paramsSignature = `${this.toolManager.activeToolID}:${activeTool?.uiVersion ?? 0}`;
    if (this.paramsHandle && paramsSignature !== this.paramsSignature) {
      const params = this.toolManager.createParamsWidget(editor);
      if (this.paramsHost) this.paramsHost.hidden = !params;
      ui.resetWidget(this.paramsHandle, params ?? Container({}));
      this.paramsSignature = paramsSignature;
    }

    const sprites: Runtime_Sprite[] = editor.projectCache.getRuntimesByType(Runtime_Sprite);
    const armatures: Runtime_Armature[] = editor.projectCache.getRuntimesByType(Runtime_Armature);
    const source = geometrySource(editor.editorState.editMode);

    this.spaceData.renderData.retain(new Set([...sprites, ...armatures].map(runtime => runtime.id))); // 表示しないrenderDataの削除
    if (this.canvas && this.canvasBBox && this.canvasContext && this.canvasBBox.width > 0 && this.canvasBBox.height > 0) {
      // textureとかのサイズ変更があるか
      this.renderData.cameraRenderData.update(
        this.camera,
        this.canvasBBox.width,
        this.canvasBBox.height,
      );
      for (const sprite of sprites) {
        const state = editor.editorState.getModelStateByID(sprite.id);
        if (!(state instanceof SpriteState)) continue ;
        let renderData = this.spaceData.renderData.getRenderData(sprite.id);
        if (!renderData) {
          renderData = this.spaceData.renderData.addSpriteRenderData(sprite);
        }
        if (renderData instanceof View_SpriteRenderData) renderData.update(sprite, state);
        const modelData = this.spaceData.renderData.getRenderData(sprite.id, "model");
        if (modelData instanceof View_SpriteRenderData) modelData.update(sprite, state, "model");
      }
      for (const armature of armatures) {
        const state = editor.editorState.getModelStateByID(armature.id);
        if (!(state instanceof ArmatureState)) continue ;
        let renderData = this.spaceData.renderData.getRenderData(armature.id);
        if (!renderData) {
          renderData = this.spaceData.renderData.addArmatureRenderData(armature);
        }
        if (renderData instanceof View_ArmatureRenderData) renderData.update(armature, state);
        const modelData = this.spaceData.renderData.getRenderData(armature.id, "model");
        if (modelData instanceof View_ArmatureRenderData) modelData.update(armature, state, "model");
      }

      // レンダリング
      if (this.canvasContext) {
        const renderTarget = this.canvasContext.getCurrentTexture();
        const renderTargetView = renderTarget.createView();
        const commandEncoder = simpleWebGPU.device.createCommandEncoder();
        this.renderData.masks.render(commandEncoder, editor.projectCache.sceneConfig.masks, sprites,
          this.renderData.cameraRenderData.cameraBuffer, renderTarget.width, renderTarget.height, sprite => {
            const data = this.spaceData.renderData.getRenderData(sprite.id, source);
            return data instanceof View_SpriteRenderData && data.vertexBuffer && data.texcoordBuffer && data.indexBuffer
              ? { vertices: data.vertexBuffer, texcoords: data.texcoordBuffer, indices: data.indexBuffer, params: data.parmsBuffer } : null;
          });
        const mainRenderPass = commandEncoder.beginRenderPass({
          colorAttachments: [
            {
              view: renderTargetView,
              clearValue: [1, 1, 1, 1],
              loadOp: "clear",
              storeOp: "store",
            },
          ],
        });

        // グリッド表示
        const bg_gridPipeline = pipelineManager.getPipelineByID("Bacground-Grid");
        if (bg_gridPipeline) {
          mainRenderPass.setBindGroup(
            0,
            simpleWebGPU.createGroup(bg_gridPipeline.groupLayout, [
              this.renderData.cameraRenderData.cameraBuffer,
            ]),
          );
          mainRenderPass.setPipeline(bg_gridPipeline.pipeline);
          mainRenderPass.draw(3, 1);
        } else {
          console.warn("グリッド表示ようのパイプラインがありません")
        }

        // シーンスプライト
        for (const sprite of sprites.sort((a, b) => a.zIndex - b.zIndex)) {
          const renderData = this.spaceData.renderData.getRenderData(sprite.id, source);
          if (renderData instanceof View_SpriteRenderData) {
            if (!(sprite.texture?.texture && renderData.vertexBuffer && renderData.indexBuffer && renderData.edgeBuffer)) continue ;

            const spritePipeline = pipelineManager.getPipelineByID("Scene-Sprite");
            if (spritePipeline) {
              for (const data of spritePipeline.vertexBuffers) {
                const source = data.source;
                if (source == "VERTEX") {
                  mainRenderPass.setVertexBuffer(
                    data.location,
                    renderData.vertexBuffer,
                  );
                } else if (source == "TEXCOORD") {
                  mainRenderPass.setVertexBuffer(
                    data.location,
                    renderData.texcoordBuffer,
                  );
                }
              }
              const bindGroup = simpleWebGPU.createGroup(
                spritePipeline.groupLayout,
                [
                  this.renderData.cameraRenderData.cameraBuffer,
                  renderData.parmsBuffer,
                  sprite.texture.texture,
                  this.renderData.masks.textureFor(sprite),
                  simpleWebGPU.sampler,
                ],
              );

              mainRenderPass.setBindGroup(0, bindGroup);
              mainRenderPass.setIndexBuffer(renderData.indexBuffer, "uint32");
              mainRenderPass.setPipeline(spritePipeline.pipeline);
              mainRenderPass.drawIndexed(sprite.indicesNum * 3, 1);
            } else {
              console.warn("スプライト表示ようのパイプラインがありません")
            }

          }
        }

        this.renderData.masks.drawDebug(mainRenderPass, this.debugMaskID);

        // Reference geometry is visual only; picking continues to use the edit-mode source.
        if (this.showReferenceGeometry) {
          const reference = source === "model" ? "runtime" : "model";
          for (const sprite of sprites) {
            const data = this.spaceData.renderData.getRenderData(sprite.id, reference);
            const pipeline = pipelineManager.getPipelineByID("Overlay-SpriteIndices");
            if (!(data instanceof View_SpriteRenderData) || !data.vertexBuffer || !data.indexBuffer || !pipeline) continue;
            mainRenderPass.setPipeline(pipeline.pipeline);
            mainRenderPass.setBindGroup(0, simpleWebGPU.createGroup(pipeline.groupLayout, [
              this.renderData.cameraRenderData.cameraBuffer, data.vertexBuffer, data.indexBuffer, this.uniform([.3, .45, .6, .4]),
            ]));
            mainRenderPass.draw(12, sprite.indicesNum);
          }
          for (const armature of armatures) {
            const data = this.spaceData.renderData.getRenderData(armature.id, reference);
            const pipeline = pipelineManager.getPipelineByID("Overlay-ArmatureBone");
            if (!(data instanceof View_ArmatureRenderData) || !pipeline) continue;
            for (const buffer of pipeline.vertexBuffers) if (buffer.source === "VERTEX") mainRenderPass.setVertexBuffer(buffer.location, data.vertexBuffer);
            mainRenderPass.setPipeline(pipeline.pipeline);
            mainRenderPass.setBindGroup(0, simpleWebGPU.createGroup(pipeline.groupLayout, [
              this.renderData.cameraRenderData.cameraBuffer, data.boneBuffer, this.uniform([1, 1, 1, .4]), data.boneColorBuffer,
            ]));
            mainRenderPass.draw(5, data.boneCount);
          }
        }

        // オーバーレイスプライト
        for (const sprite of sprites) {
          if (editor.editorState.activeObject === sprite.model) {
            const renderData = this.spaceData.renderData.getRenderData(sprite.id, source);
            if (!(renderData instanceof View_SpriteRenderData)) continue ;
            if (!(renderData.vertexBuffer && renderData.indexBuffer && renderData.edgeBuffer && renderData.selectVertexBuffer && renderData.silhouetteEdgeBuffer && renderData.weightBuffer)) continue ;

            if (editor.editorState.editMode === ViewEditModes.WEIGHTPAINT) {
              const spriteIndicesPipeline = pipelineManager.getPipelineByID("Overlay-SpriteWeight");
              if (spriteIndicesPipeline) {
                const bindGroup = simpleWebGPU.createGroup(
                  spriteIndicesPipeline.groupLayout,
                  [
                    this.renderData.cameraRenderData.cameraBuffer,
                    renderData.vertexBuffer,
                    renderData.weightBuffer,
                  ],
                );
                mainRenderPass.setBindGroup(0, bindGroup);
                mainRenderPass.setPipeline(spriteIndicesPipeline.pipeline);
                mainRenderPass.draw(4, sprite.verticesNum);
              } else {
                console.warn("ウェイト表示ようのパイプラインがありません");
              }
            } else {
              const spriteIndicesPipeline = pipelineManager.getPipelineByID("Overlay-SpriteIndices");
              if (spriteIndicesPipeline) {
                const bindGroup = simpleWebGPU.createGroup(
                  spriteIndicesPipeline.groupLayout,
                  [
                    this.renderData.cameraRenderData.cameraBuffer,
                    renderData.vertexBuffer,
                    renderData.indexBuffer,
                    this.uniform([0.1, 0.1, 0.1, 1]),
                  ],
                );
                mainRenderPass.setBindGroup(0, bindGroup);
                mainRenderPass.setPipeline(spriteIndicesPipeline.pipeline);
                mainRenderPass.draw(4 * 3, sprite.indicesNum);
              } else {
                console.warn("スプライトオーバレイ表示ようのパイプライン1がありません");
              }

              const spriteEdgetPipeline = pipelineManager.getPipelineByID("Overlay-SpriteEdge");
              if (spriteEdgetPipeline) {
                mainRenderPass.setPipeline(spriteEdgetPipeline.pipeline);
                if (sprite.edgesNum) {
                  const edgeBindGroup = simpleWebGPU.createGroup(
                    spriteEdgetPipeline.groupLayout,
                    [
                      this.renderData.cameraRenderData.cameraBuffer,
                      renderData.vertexBuffer,
                      renderData.edgeBuffer,
                      this.uniform([0.1, 0.7, 1.0, 1]),
                    ],
                  );
                  mainRenderPass.setBindGroup(0, edgeBindGroup);
                  mainRenderPass.draw(4, sprite.edgesNum);
                }

                if (sprite.silhouetteEdgesNum) {
                  const silhouetteEdgeBindGroup = simpleWebGPU.createGroup(
                    spriteEdgetPipeline.groupLayout,
                    [
                      this.renderData.cameraRenderData.cameraBuffer,
                      renderData.vertexBuffer,
                      renderData.silhouetteEdgeBuffer,
                      this.uniform([0.1, 0.7, 0.2, 1]),
                    ],
                  );
                  mainRenderPass.setBindGroup(0, silhouetteEdgeBindGroup);
                  mainRenderPass.draw(4, sprite.silhouetteEdgesNum);
                }
              } else {
                console.warn("スプライトオーバレイ表示ようのパイプライン2がありません");
              }

              const spriteVertextPipeline = pipelineManager.getPipelineByID("Overlay-SpriteVertex");
              if (spriteVertextPipeline) {
                const bindGroup = simpleWebGPU.createGroup(
                  spriteVertextPipeline.groupLayout,
                  [
                    this.renderData.cameraRenderData.cameraBuffer,
                    renderData.vertexBuffer,
                    this.uniform([1, 0.7, 0.2, 1]),
                  ],
                );
                mainRenderPass.setBindGroup(0, bindGroup);
                mainRenderPass.setPipeline(spriteVertextPipeline.pipeline);
                mainRenderPass.draw(4, sprite.verticesNum);
              } else {
                console.warn("スプライトオーバレイ表示ようのパイプライン3がありません");
              }
              if (renderData.selectedVertexCount) {
                const spriteVertextPipeline = pipelineManager.getPipelineByID("Overlay-SpriteVertex");
                if (spriteVertextPipeline) {
                  const bindGroup = simpleWebGPU.createGroup(
                    spriteVertextPipeline.groupLayout,
                    [
                      this.renderData.cameraRenderData.cameraBuffer,
                      renderData.selectVertexBuffer,
                      this.uniform([1, 1, 1, 1]),
                    ],
                  );
                  mainRenderPass.setBindGroup(0, bindGroup);
                  mainRenderPass.setPipeline(spriteVertextPipeline.pipeline);
                  mainRenderPass.draw(4, renderData.selectedVertexCount);
                } else {
                  console.warn("スプライトオーバレイ表示ようのパイプライン4がありません");
                }
              }
            }
          }
        }

        // オーバーレイアーマチュア
        for (const armature of armatures) {
          const renderData = this.spaceData.renderData.getRenderData(armature.id, source);
          if (!(renderData instanceof View_ArmatureRenderData)) continue ;
          const armatureBonePipeline = pipelineManager.getPipelineByID("Overlay-ArmatureBone");
          if (armatureBonePipeline) {
            for (const data of armatureBonePipeline.vertexBuffers) {
              const source = data.source;
              if (source == "VERTEX") {
                mainRenderPass.setVertexBuffer(
                  data.location,
                  renderData.vertexBuffer,
                );
              }
            }
            const bindGroup = simpleWebGPU.createGroup(
              armatureBonePipeline.groupLayout,
              [
                this.renderData.cameraRenderData.cameraBuffer,
                renderData.boneBuffer,
                this.uniform([1, 1, 1, 1]),
                renderData.boneColorBuffer,
              ],
            );
            mainRenderPass.setBindGroup(0, bindGroup);
            mainRenderPass.setPipeline(armatureBonePipeline.pipeline);
            mainRenderPass.draw(5, renderData.boneCount);

            if (renderData.selectedBoneCount) {
              const bindGroup = simpleWebGPU.createGroup(
                armatureBonePipeline.groupLayout,
                [
                  this.renderData.cameraRenderData.cameraBuffer,
                  renderData.selectBoneBuffer,
                  this.uniform([1, 1, 1, 1]),
                  renderData.selectBoneColorBuffer,
                ],
              );
              mainRenderPass.setBindGroup(0, bindGroup);
              mainRenderPass.setPipeline(armatureBonePipeline.pipeline);
              mainRenderPass.draw(5, renderData.selectedBoneCount);
            }
          } else {
            console.warn("アーマチュアオーバレイ表示ようのパイプライン1がありません");
          }

          if (editor.editorState.activeObject === armature.model) {
            const boneVertexPipeline = pipelineManager.getPipelineByID("Overlay-ArmatureVertex");
            if (boneVertexPipeline) {
              const bindGroup = simpleWebGPU.createGroup(
                boneVertexPipeline.groupLayout,
                [
                  this.renderData.cameraRenderData.cameraBuffer,
                  renderData.boneVertexBuffer,
                  this.uniform([1, 1, 1, 1]),
                  renderData.boneVertexColorBuffer,
                ],
              );
              mainRenderPass.setBindGroup(0, bindGroup);
              mainRenderPass.setPipeline(boneVertexPipeline.pipeline);
              mainRenderPass.draw(4, renderData.boneCount * 2);

              if (renderData.selectedVertexCount) {
                const bindGroup = simpleWebGPU.createGroup(
                  boneVertexPipeline.groupLayout,
                  [
                    this.renderData.cameraRenderData.cameraBuffer,
                    renderData.selectBoneVertexBuffer,
                    this.uniform([1, 1, 1, 1]),
                    renderData.selectBoneVertexColorBuffer,
                  ],
                );
                mainRenderPass.setBindGroup(0, bindGroup);
                mainRenderPass.setPipeline(boneVertexPipeline.pipeline);
                mainRenderPass.draw(4, renderData.selectedVertexCount, 0);
              }
            } else {
              console.warn("アーマチュアオーバレイ表示ようのパイプライン2がありません");
            }
          }
        }

        // オーバレイツール
        this.toolManager.drawOverlay({ editor, view: this, renderPass: mainRenderPass });

        mainRenderPass.end();
        simpleWebGPU.device.queue.submit([commandEncoder.finish()]);
      }
    }

    if (this.objectIDTextureView) {
      const commandEncoder = simpleWebGPU.device.createCommandEncoder();
      const mainRenderPass = commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            view: this.objectIDTextureView,
            clearValue: [1000, 0, 0, 0],
            loadOp: "clear",
            storeOp: "store",
          },
        ],
      });

      // スプライト
      for (const sprite of sprites) {
        const renderData = this.spaceData.renderData.getRenderData(sprite.id, source);
        if (!(renderData instanceof View_SpriteRenderData)) continue;
        if (!(renderData.indexBuffer)) continue;

        const spritePipeline = pipelineManager.getPipelineByID("ObjectID-Sprite");
        if (spritePipeline) {
          for (const data of spritePipeline.vertexBuffers) {
            const source = data.source;
            if (source == "VERTEX") {
              mainRenderPass.setVertexBuffer(
                data.location,
                renderData.vertexBuffer,
              );
            } else if (source == "TEXCOORD") {
              mainRenderPass.setVertexBuffer(
                data.location,
                renderData.texcoordBuffer,
              );
            }
          }
          const bindGroup = simpleWebGPU.createGroup(
            spritePipeline.groupLayout,
            [
              this.renderData.cameraRenderData.cameraBuffer,
              renderData.objectIDBuffer,
            ],
          );

          mainRenderPass.setBindGroup(0, bindGroup);
          mainRenderPass.setIndexBuffer(renderData.indexBuffer, "uint32");
          mainRenderPass.setPipeline(spritePipeline.pipeline);
          mainRenderPass.drawIndexed(sprite.indicesNum * 3, 1, 0);
        } else {
          console.warn("パイプラインObjectID-Spriteが存在しません")
        }

      }

      // アーマチュア
      for (const armature of armatures) {
        const renderData = this.spaceData.renderData.getRenderData(armature.id, source);
        if (!(renderData instanceof View_ArmatureRenderData)) continue;
        if (!(renderData.boneBuffer)) continue;

        const armaturePipeline = pipelineManager.getPipelineByID("ObjectID-Armature");
        if (armaturePipeline) {
          for (const data of armaturePipeline.vertexBuffers) {
            const source = data.source;
            if (source == "VERTEX") {
              mainRenderPass.setVertexBuffer(
                data.location,
                renderData.vertexBuffer,
              );
            }
          }
          const bindGroup = simpleWebGPU.createGroup(
            armaturePipeline.groupLayout,
            [
              this.renderData.cameraRenderData.cameraBuffer,
              renderData.boneBuffer,
              renderData.objectIDBuffer,
            ],
          );
          mainRenderPass.setBindGroup(0, bindGroup);
          mainRenderPass.setPipeline(armaturePipeline.pipeline);
          mainRenderPass.draw(5, renderData.boneCount);
        } else {
          console.warn("パイプライン ObjectID-Armature が存在しません")
        }
      }
      mainRenderPass.end();
      simpleWebGPU.device.queue.submit([commandEncoder.finish()]);
    }
  }
}

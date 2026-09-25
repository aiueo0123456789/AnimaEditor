import { Runtime_Armature } from "../../../core/projectCache/runtime/Armature";
import { Runtime_Sprite } from "../../../core/projectCache/runtime/Sprite";
import { AnimaEditor } from "../../../editor/Editor";
import { InputManager } from "../../../manager/InputManager";
import { PipelineManager } from "../../../manager/PipelineManager";
import { simpleWebGPU } from "../../../util/simpleWebGPU";
import { Vec2, Vec2Math } from "../../../util/vecMath";
import { ToolRender, ToolManager, UIComponent } from "../UI";
import { View_Camera } from "./Camera";
import { UIComponent_View_SpaceData } from "./SpaceData";
import { CommandManager } from "../../../manager/CommandManager";
import { SelectTool } from "./tool/SelectTool";
import { ObjectSelectTool } from "./tool/ObjectSelectTool";
import { AddVertexTool } from "./tool/AddVertexTool";
import { RotationTool } from "./tool/RotationTool";
import { TranslateTool } from "./tool/TranslateTool";
import { SpriteState } from "../../../editor/editorState/state/States/Sprite";
import { ArmatureState } from "../../../editor/editorState/state/States/Armature";
import { View_ArmatureRenderData } from "./renderData/ArmatureRenderData";
import { View_SpriteRenderData } from "./renderData/SpriteRenderData";
import { AddArmatureTool } from "./tool/AddArmatureTool";
import { AddBoneTool } from "./tool/AddBoneTool";
import { AddEdgeTool } from "./tool/AddEdgeTool";
import { DeleteEdgeTool } from "./tool/DeleteEdgeTool";
import { DeleteVertexTool } from "./tool/DeleteVertexTool";
import { UIManager } from "../../../manager/ui/UIManager";
import type { WidgetHandle } from "../../../manager/ui/WidgetTree";
import { bind, Button, Canvas, Column, Container, Header, Main, Row, Text, Select } from "../../../manager/ui/components";
import type { Widget } from "../../../manager/ui/components";
import { WeightPaintTool } from "./tool/WeightPaintTool";

import { ScaleTool } from "./tool/ScaleTool";
import { DeleteBoneTool } from "./tool/DeleteBoneTool";
import { CameraRenderData } from "./renderData/CameraRenderData";
import { EditorEvent, EditorEventType } from "../../../manager/EventManager";
import { ViewEditModes } from "./ViewEditModes";

export class View_RenderData {
  public cameraRenderData = new CameraRenderData();

  dispose() {
    this.cameraRenderData.cameraBuffer.destroy();
  }
}

let counter = 0;
export class UIComponent_View extends UIComponent {
  private handle: WidgetHandle | null = null;
  private host: HTMLElement | null = null;
  private gesture = false;
  private hovering = false;
  private activeToolID = "";
  private toolbarHandle: WidgetHandle | null = null;
  private toolbarSignature = "";
  private lastMode: ViewEditModes | null = null;

  private get availableTools(): ToolRender[] {
    const allowed = this.spaceData.modeToToolMap[this.spaceData.editMode] ?? [];
    return this.tools.filter(tool => allowed.includes(tool.callTool));
  }

  private syncTool(): void {
    const tools = this.availableTools;
    if (!tools.some(tool => tool.id === this.currentTool)) this.currentTool = tools[0]?.id ?? "";
    if (this.lastMode === this.spaceData.editMode && this.activeToolID === this.currentTool) return;
    this.toolManager.activeTool?.deactivate();
    this.toolManager.activeTool = null;
    this.gesture = false;
    this.lastMode = this.spaceData.editMode;
    const tool = tools.find(item => item.id === this.currentTool);
    if (tool) this.toolManager.activate(tool.callTool);
    this.activeToolID = this.currentTool;
  }

  private buildToolbar(ui: UIManager): Widget {
    const labels: Record<string, string> = { objectSelect: "オブジェクト選択", select: "頂点選択", translate: "移動",
      rotation: "回転", scale: "拡大縮小", addVertex: "頂点追加", DeleteVertex: "頂点削除", AddEdge: "辺追加",
      DeleteEdge: "辺削除", AddBone: "ボーン追加", DeleteBone: "ボーン削除", AddArmature: "アーマチュア追加", WeightPaint: "ウェイトペイント" };
    return Column({ gap: 3, children: this.availableTools.map(tool => Button({
          label: labels[tool.id] ?? tool.id, tooltip: labels[tool.id] ?? tool.id, icon: tool.icon, iconOnly: true,
          pressed: bind({ read: () => this.currentTool === tool.id }),
          onPress: () => {
            if (!this.availableTools.includes(tool)) return;
            this.currentTool = tool.id;
            this.syncTool();
            if (this.toolbarHandle) ui.invalidateWidget(this.toolbarHandle);
          },
    })) });
  }

  private _renderData: View_RenderData | null = new View_RenderData();
  get renderData(): View_RenderData {
    if (!(this._renderData instanceof View_RenderData)) this._renderData = new View_RenderData();
    return this._renderData;
  }

  public override dispose(editor: AnimaEditor): void {
    this.toolManager.activeTool?.deactivate();
    this.toolManager.activeTool = null;
    this.activeToolID = "";
    if (this.handle) editor.getManager(UIManager)?.disposeWidget(this.handle);
    this.handle = null;
    this.host = null;
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
  public tools: ToolRender[];
  public get currentTool(): string { return this.spaceData.currentTool; }
  public set currentTool(value: string) { this.spaceData.currentTool = value; }
  public toolManager: ToolManager = new ToolManager();
  public objectIDTexture: GPUTexture | null = null;
  public objectIDTextureView: GPUTextureView | null = null;

  constructor(public readonly spaceData = new UIComponent_View_SpaceData()) {
    super({ name: "View", id: counter, icon: "eye" });
    counter++;

    this.tools = [
      new ToolRender("objectSelect", "select", ObjectSelectTool),
      new ToolRender("select", "select", SelectTool),
      new ToolRender("translate", "translate", TranslateTool),
      new ToolRender("rotation", "rotation", RotationTool),
      new ToolRender("scale", "scale", ScaleTool),
      new ToolRender("addVertex", "addPoint", AddVertexTool),
      new ToolRender("DeleteVertex", "removePoint", DeleteVertexTool),
      new ToolRender("AddEdge", "addEdge", AddEdgeTool),
      new ToolRender("DeleteEdge", "removeEdge", DeleteEdgeTool),
      new ToolRender("AddBone", "addBone", AddBoneTool),
      new ToolRender("DeleteBone", "removeBone", DeleteBoneTool),
      new ToolRender("AddArmature", "addPoint", AddArmatureTool),
      new ToolRender("WeightPaint", "addPoint", WeightPaintTool),
    ];
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
    this.syncTool();
    const input = editor.getManager(InputManager);
    if (!input || !this.canvas) return;
    this.canvasBBox = this.canvas.getBoundingClientRect();
    if (this.gesture) {
      this.toolManager.activeTool?.update(editor, this);
      if (input.getKeyUp("Mouse0") || !input.getKey("Mouse0")) this.gesture = false;
    }
    if (!this.hovering || document.activeElement !== this.canvas) return;
    if (this.gesture) return;
    if (input.getKey("ControlLeft") || input.getKey("ControlRight")) {
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
    const cancel = (): void => { this.gesture = false; this.toolManager.activeTool?.deactivate(); };
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
          new EditorEvent(EditorEventType.change, editor.editorState, "activeObject"),
        ],
        value: bind({ read: () => this.spaceData.editMode }),
        options: editor.editorState.getModelStateByID(editor.editorState.activeObject?.id ?? "")?.availableModes.map(mode => ({ value: mode, label: mode })) ?? [{value: ViewEditModes.OBJECT, label: ViewEditModes.OBJECT}],
        onChange: value => { if (value && Object.values(ViewEditModes).includes(value as ViewEditModes)) {
          this.spaceData.editMode = value as ViewEditModes;
          this.syncTool();
        }}
      });
      this.handle = ui.mountWidget(parent, Column({ className: "ui-panel ui-view", children: [
        Header({ gap: 8, children: [
          Text({ text: this.name }),
          modeChange
        ] }),
        Main({ className: "ui-view-main", padding: 0, overflow: "hidden", children: [
          Canvas({ className: "ui-view-canvas", label: "Animation viewport", onMount: canvas => this.mountCanvas(editor, canvas) }),
          Container({ className: "ui-view-toolbar", onMount: element => {
            const handle = ui.mountWidget(element, this.buildToolbar(ui));
            this.toolbarHandle = handle;
            this.toolbarSignature = "";
            return () => { ui.disposeWidget(handle); this.toolbarHandle = null; };
          } }),
        ] }),
      ] }));
      this.host = parent;
    }
    this.syncTool();
    const signature = JSON.stringify([this.spaceData.editMode, this.availableTools.map(tool => tool.id)]);
    const modeChanged = signature !== this.toolbarSignature;
    if (this.toolbarHandle) {
      if (signature !== this.toolbarSignature) ui.resetWidget(this.toolbarHandle, this.buildToolbar(ui));
      this.toolbarSignature = signature;
      ui.invalidateWidget(this.toolbarHandle);
    }
    if (modeChanged && this.handle) ui.invalidateWidget(this.handle);

    const sprites: Runtime_Sprite[] = editor.projectCache.getRuntimesByType(Runtime_Sprite);
    const armatures: Runtime_Armature[] = editor.projectCache.getRuntimesByType(Runtime_Armature);

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
      }
      for (const armature of armatures) {
        const state = editor.editorState.getModelStateByID(armature.id);
        if (!(state instanceof ArmatureState)) continue ;
        let renderData = this.spaceData.renderData.getRenderData(armature.id);
        if (!renderData) {
          renderData = this.spaceData.renderData.addArmatureRenderData(armature);
        }
        if (renderData instanceof View_ArmatureRenderData) renderData.update(armature, state);
      }

      // レンダリング
      if (this.canvasContext) {
        const renderTarget = this.canvasContext.getCurrentTexture();
        const renderTargetView = renderTarget.createView();
        const commandEncoder = simpleWebGPU.device.createCommandEncoder();
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
          const renderData = this.spaceData.renderData.getRenderData(sprite.id);
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
                  sprite.texture.texture,
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

        // オーバーレイスプライト
        for (const sprite of sprites) {
          if (editor.editorState.activeObject === sprite.model) {
            const renderData = this.spaceData.renderData.getRenderData(sprite.id);
            if (!(renderData instanceof View_SpriteRenderData)) continue ;
            if (!(renderData.vertexBuffer && renderData.indexBuffer && renderData.edgeBuffer && renderData.selectVertexBuffer && renderData.silhouetteEdgeBuffer && renderData.weightBuffer)) continue ;

            if (this.toolManager.activeTool instanceof WeightPaintTool) {
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
          const renderData = this.spaceData.renderData.getRenderData(armature.id);
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
                this.uniform([1, 0, 0, 1]),
              ],
            );
            mainRenderPass.setBindGroup(0, bindGroup);
            mainRenderPass.setPipeline(armatureBonePipeline.pipeline);
            mainRenderPass.draw(5, armature.bones.length);

            if (renderData.selectedBoneCount) {
              const bindGroup = simpleWebGPU.createGroup(
                armatureBonePipeline.groupLayout,
                [
                  this.renderData.cameraRenderData.cameraBuffer,
                  renderData.selectBoneBuffer,
                  this.uniform([1, 1, 1, 1]),
                ],
              );
              mainRenderPass.setBindGroup(0, bindGroup);
              mainRenderPass.setPipeline(armatureBonePipeline.pipeline);
              mainRenderPass.draw(5, renderData.selectedVertexCount);
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
                  this.uniform([1, 0, 0, 1]),
                ],
              );
              mainRenderPass.setBindGroup(0, bindGroup);
              mainRenderPass.setPipeline(boneVertexPipeline.pipeline);
              mainRenderPass.draw(4, armature.bones.length * 2);

              if (renderData.selectedVertexCount) {
                const bindGroup = simpleWebGPU.createGroup(
                  boneVertexPipeline.groupLayout,
                  [
                    this.renderData.cameraRenderData.cameraBuffer,
                    renderData.selectBoneVertexBuffer,
                    this.uniform([1, 1, 1, 1]),
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
        if (this.toolManager.activeTool) {
          this.toolManager.activeTool.drawOverlay(
            editor,
            this,
            mainRenderPass,
          );
        }

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
        const renderData = this.spaceData.renderData.getRenderData(sprite.id);
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
        const renderData = this.spaceData.renderData.getRenderData(armature.id);
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
          mainRenderPass.draw(5, armature.bones.length);
        } else {
          console.warn("パイプライン ObjectID-Armature が存在しません")
        }
      }
      mainRenderPass.end();
      simpleWebGPU.device.queue.submit([commandEncoder.finish()]);
    }
  }
}

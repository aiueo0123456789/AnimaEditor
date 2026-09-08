import { Runtime_Armature } from "../../../core/projectCache/runtime/Armature";
import { Runtime_Sprite } from "../../../core/projectCache/runtime/Sprite";
import { AnimaEditor } from "../../../editor/Editor";
import { JTag } from "../../../library/JTag/JTag";
import { JTag_Base } from "../../../library/JTag/tag/Base";
import { JTag_Button } from "../../../library/JTag/tag/Button";
import { JTag_Canvas } from "../../../library/JTag/tag/Canvas";
import { JTag_Container } from "../../../library/JTag/tag/Container";
import { JTag_CustomTag } from "../../../library/JTag/tag/CustomTag";
import { JTag_Stack } from "../../../library/JTag/tag/Stack";
import { InputManager } from "../../../manager/InputManager";
import { PipelineManager } from "../../../manager/PipelineManager";
import { resizeObserver } from "../../../util/resizeObserver";
import { simpleWebGPU } from "../../../util/simpleWebGPU";
import { Vec2, Vec2Math } from "../../../util/vecMath";
import { setStopPropagation, ToolRender, ToolManager, UIComponent } from "../UI";
import { View_Camera } from "./Camera";
import { UIComponent_View_SpaceData } from "./SpaceData";
import { CommandManager } from "../../../manager/CommandManager";
import { SelectTool } from "./tool/SelectTool";
import { ObjectSelectTool } from "./tool/ObjectSelectTool";
import { AddVertexTool } from "./tool/AddVertexTool";
import { RotationTool } from "./tool/RotationTool";
import { TranslateTool } from "./tool/TranslateTool";
import { SetPropertyCommand, SetPropertyCommandInput } from "../../../editor/command/SetProperty";
import { SpriteState } from "../../../editor/editorState/state/Sprite";
import { ArmatureState } from "../../../editor/editorState/state/Armature";
import { View_ArmatureRenderData } from "./renderData/ArmatureRenderData";
import { View_SpriteRenderData } from "./renderData/SpriteRenderData";
import { AddArmatureTool } from "./tool/AddArmatureTool";
import { AddBoneTool } from "./tool/AddBoneTool";
import { AddEdgeTool } from "./tool/AddEdgeTool";
import { DeleteEdgeTool } from "./tool/DeleteEdgeTool";
import { DeleteVertexTool } from "./tool/DeleteVertexTool";
import { JTag_ToolBar } from "../../../library/JTag/tag/ToolBar";
import { WeightPaintTool } from "./tool/WeightPaintTool";

let counter = 0;
export class UIComponent_View extends UIComponent {
  public spaceData: UIComponent_View_SpaceData;
  public camera: View_Camera;
  public canvas: JTag_Canvas | null;
  public canvasBBox: DOMRect | null;
  public canvasContext: any;
  public tools: ToolRender[];
  public currentTool: string;
  public toolManager: ToolManager;
  public objectIDTexture: GPUTexture | null;
  public objectIDTextureView: GPUTextureView | null;

  constructor() {
    super({ name: "View", id: counter, icon: "eye" });
    counter++;

    this.spaceData = new UIComponent_View_SpaceData();

    this.camera = new View_Camera();

    this.canvas = null;
    this.canvasBBox = null;
    this.canvasContext = null;

    this.tools = [
      new ToolRender("objectSelect", "select", ObjectSelectTool),
      new ToolRender("select", "select", SelectTool),
      new ToolRender("translate", "translate", TranslateTool),
      new ToolRender("rotation", "rotation", RotationTool),
      // new ToolRender("scale", "scale", ScaleTool),
      new ToolRender("addVertex", "addPoint", AddVertexTool),
      new ToolRender("DeleteVertex", "removePoint", DeleteVertexTool),
      new ToolRender("AddEdge", "addEdge", AddEdgeTool),
      new ToolRender("DeleteEdge", "removeEdge", DeleteEdgeTool),
      new ToolRender("AddBone", "addBone", AddBoneTool),
      new ToolRender("DeleteBone", "removeBone", AddBoneTool),
      new ToolRender("AddArmature", "addPoint", AddArmatureTool),
      new ToolRender("WeightPaint", "weightPaint", WeightPaintTool),
    ];

    this.currentTool = this.tools[0].id;

    this.toolManager = new ToolManager();

    this.objectIDTexture = null;
    this.objectIDTextureView = null;
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

  public override input(input: InputManager, editor: AnimaEditor): void {
    if (this.toolManager.activeTool) this.toolManager.activeTool.update(editor, this);
    const commandManager = editor.getManager(CommandManager);
    if (!commandManager) return ;
    if (input.getKey("ShiftLeft")) {
      if (input.getKey("MetaLeft") && input.getKeyDown("KeyZ")) {
        commandManager.redo();
      }
    } else {
      if (input.getKey("MetaLeft") && input.getKeyDown("KeyZ")) {
        commandManager.undo();
      }
    }
    if (input.getKey("ControlLeft")) {
      this.camera.zoom += input.mouseScrollDelta[1] * 0.01;
      this.camera.zoom = Math.max(0.05, this.camera.zoom);
    } else {
      Vec2Math.sub(
        this.camera.position,
        Vec2Math.mul(this.clientVecToWorldVec(input.mouseScrollDelta), Vec2Math.create(1, -1)),
        this.camera.position,
      );
    }
    // if (input.getKeyDown("Tab")) {
    //   /** @type {SetPropertyCommand} */
    //   const command =
    //     editorContext.CommandManager.createCommand(SetPropertyCommand);
    //   // if (editorContext.editorState.editMode == EditModes.Object) {
    //   //   if (editorContext.editorState.activeObject instanceof Model_Sprite) {
    //   //     command.set(editorContext.editorState, "editMode", EditModes.Vertex);
    //   //   }
    //   // } else {
    //   //   command.set(editorContext.editorState, "editMode", EditModes.Object);
    //   // }
    //   editorContext.commandManager.appendCommand(command);
    //   editorContext.commandManager.execute();
    // }
  }

  private updateObjectIDTexture(): void {
    if (this.canvas) {
      this.objectIDTexture = simpleWebGPU.createTexture2D(
        [this.canvas.body.offsetWidth, this.canvas.body.offsetHeight],
        "r32uint",
      );
      this.objectIDTextureView = this.objectIDTexture.createView();
    }
  }

  public override update(editor: AnimaEditor, parent: JTag_CustomTag): void {
    const pipelineManager = editor.getManager(PipelineManager);
    if (!pipelineManager) return ;
    const commandManager = editor.getManager(CommandManager);
    if (!commandManager) return ;

    const libraryJTag = editor.library.JTag;
    if (!parent.children.length || parent.children[0].id !== `View`) {
      libraryJTag.clear(parent);
      const container = JTag.createTag(JTag_Container);
      container.body.classList.add("group-container");
      container.id = `View`;
      libraryJTag.append(parent, container);

      const header = JTag.createTag(JTag_Base);
      header.body.classList.add("header");

      const iconTag = JTag.createTag(JTag_Button);
      iconTag.setIcon(JTag.getSvg(this.icon));
      iconTag.setText(this.name);
      libraryJTag.append(header, iconTag);

      const body = JTag.createTag(JTag_Stack);
      body.body.classList.add("main");

      libraryJTag.append(container, header);
      libraryJTag.append(container, body);

      this.canvas = JTag.createTag(JTag_Canvas);

      const toolBar = JTag.createTag(JTag_ToolBar);
      // section.setTitle("セクション");
      const toolBarMap: Map<string, JTag_Button> = new Map();
      for (const tool of this.tools) {
        const tag_tool = JTag.createTag(JTag_Button);
        tag_tool.setIcon(JTag.getSvg(tool.icon));
        libraryJTag.append(toolBar, tag_tool);
        toolBarMap.set(tool.id, tag_tool);

        setStopPropagation(tag_tool.body, "mouseup");
        setStopPropagation(tag_tool.body, "click");

        tag_tool.body.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          const recorder = commandManager.setCommandRecorder();
          recorder?.setCommand(SetPropertyCommand, {model: this, path: "currentTool", newValue: tool.id} as SetPropertyCommandInput);
          recorder?.finishCommand();
          commandManager.finishCommandRecorder();
        });
      }
      editor.observer.add(
        { object: this, property: "currentTool" },
        (current: string, last: string, isInit: boolean) => {
          if (last) {
            const tag_tool = toolBarMap.get(last);
            if (tag_tool) tag_tool.body.classList.remove("active");
          }
          if (current) {
            const tag_tool = toolBarMap.get(current);
            if (tag_tool) tag_tool.body.classList.add("active");
          }
          for (const tool of this.tools) {
            if (tool.id === current) {
              if (tool.callTool) {
                this.toolManager.activate(tool.callTool);
                break;
              }
            }
          }
        },
        true,
      );
      libraryJTag.append(body, this.canvas);
      libraryJTag.append(body, toolBar);

      this.canvasContext = this.canvas.body.getContext("webgpu");
      this.canvasContext.configure({
        device: simpleWebGPU.device,
        format: simpleWebGPU.preferredCanvasFormat,
      });
      resizeObserver.add(this.canvas.body, (canvas: HTMLCanvasElement): void => {
        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;

        this.canvasBBox = canvas.getBoundingClientRect();

        this.updateObjectIDTexture();
      });

      this.updateObjectIDTexture();
    }

    const sprites: Runtime_Sprite[] = editor.projectCache.getRuntimesByType(Runtime_Sprite);
    const armatures: Runtime_Armature[] = editor.projectCache.getRuntimesByType(Runtime_Armature);

    if (this.canvas && this.canvasBBox && this.canvasContext) {
      // textureとかのサイズ変更があるか
      this.spaceData.cameraRenderData.update(
        this.camera,
        this.canvasBBox.width,
        this.canvasBBox.height,
      );
      for (const sprite of sprites) {
        const state = editor.editorState.getModelStateByID(sprite.id);
        if (!(state instanceof SpriteState)) continue ;
        let renderData = this.spaceData.getRenderData(sprite.id);
        if (!renderData) {
          renderData = this.spaceData.addSpriteRenderData(sprite);
        }
        if (renderData instanceof View_SpriteRenderData) renderData.update(sprite, state);
      }
      for (const armature of armatures) {
        const state = editor.editorState.getModelStateByID(armature.id);
        if (!(state instanceof ArmatureState)) continue ;
        let renderData = this.spaceData.getRenderData(armature.id);
        if (!renderData) {
          renderData = this.spaceData.addArmatureRenderData(armature);
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
              this.spaceData.cameraRenderData.cameraBuffer,
            ]),
          );
          mainRenderPass.setPipeline(bg_gridPipeline.pipeline);
          mainRenderPass.draw(3, 1);
        } else {
          console.warn("グリッド表示ようのパイプラインがありません")
        }

        // シーンスプライト
        for (const sprite of sprites.sort((a, b) => a.zIndex - b.zIndex)) {
          const renderData = this.spaceData.getRenderData(sprite.id);
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
                  this.spaceData.cameraRenderData.cameraBuffer,
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
            const spriteState = editor.editorState.getModelStateByID(sprite.id,);
            if (!(spriteState instanceof SpriteState)) continue ;

            const renderData = this.spaceData.getRenderData(sprite.id);
            if (!(renderData instanceof View_SpriteRenderData)) continue ;
            if (!(renderData.vertexBuffer && renderData.indexBuffer && renderData.edgeBuffer && renderData.selectVertexBuffer && renderData.silhouetteEdgeBuffer)) continue ;

            const spriteIndicesPipeline = pipelineManager.getPipelineByID("Overlay-SpriteIndices");
            if (spriteIndicesPipeline) {
              const bindGroup = simpleWebGPU.createGroup(
                spriteIndicesPipeline.groupLayout,
                [
                  this.spaceData.cameraRenderData.cameraBuffer,
                  renderData.vertexBuffer,
                  renderData.indexBuffer,
                  simpleWebGPU.createBuffer(
                    4 * 4,
                    ["U"],
                    new Float32Array([0.1, 0.1, 0.1, 1]),
                  ),
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
                    this.spaceData.cameraRenderData.cameraBuffer,
                    renderData.vertexBuffer,
                    renderData.edgeBuffer,
                    simpleWebGPU.createBuffer(
                      4 * 4,
                      ["U"],
                      new Float32Array([0.1, 0.7, 1.0, 1]),
                    ),
                  ],
                );
                mainRenderPass.setBindGroup(0, edgeBindGroup);
                mainRenderPass.draw(4, sprite.edgesNum);
              }

              if (sprite.silhouetteEdgesNum) {
                const silhouetteEdgeBindGroup = simpleWebGPU.createGroup(
                  spriteEdgetPipeline.groupLayout,
                  [
                    this.spaceData.cameraRenderData.cameraBuffer,
                    renderData.vertexBuffer,
                    renderData.silhouetteEdgeBuffer,
                    simpleWebGPU.createBuffer(
                      4 * 4,
                      ["U"],
                      new Float32Array([0.1, 0.7, 0.2, 1]),
                    ),
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
                  this.spaceData.cameraRenderData.cameraBuffer,
                  renderData.vertexBuffer,
                  simpleWebGPU.createBuffer(
                    4 * 4,
                    ["U"],
                    new Float32Array([1, 0.7, 0.2, 1]),
                  ),
                ],
              );
              mainRenderPass.setBindGroup(0, bindGroup);
              mainRenderPass.setPipeline(spriteVertextPipeline.pipeline);
              mainRenderPass.draw(4, sprite.verticesNum);
            } else {
              console.warn("スプライトオーバレイ表示ようのパイプライン3がありません");
            }
            if (spriteState.selectedVertexIndices.length) {
              const spriteVertextPipeline = pipelineManager.getPipelineByID("Overlay-SpriteVertex");
              if (spriteVertextPipeline) {
                const bindGroup = simpleWebGPU.createGroup(
                  spriteVertextPipeline.groupLayout,
                  [
                    this.spaceData.cameraRenderData.cameraBuffer,
                    renderData.selectVertexBuffer,
                    simpleWebGPU.createBuffer(
                      4 * 4,
                      ["U"],
                      new Float32Array([1, 1, 1, 1]),
                    ),
                  ],
                );
                mainRenderPass.setBindGroup(0, bindGroup);
                mainRenderPass.setPipeline(spriteVertextPipeline.pipeline);
                mainRenderPass.draw(4, spriteState.selectedVertexIndices.length);
              } else {
                console.warn("スプライトオーバレイ表示ようのパイプライン4がありません");
              }
            }
          }
        }

        // オーバーレイアーマチュア
        for (const armature of armatures) {
          const renderData = this.spaceData.getRenderData(armature.id);
          if (!(renderData instanceof View_ArmatureRenderData)) continue ;
          if (!(renderData.boneBuffer && renderData.boneVertexBuffer && renderData.selectBoneVertexBuffer)) continue ;

          const armaturePipeline = pipelineManager.getPipelineByID("Overlay-Armature");
          if (armaturePipeline) {
            for (const data of armaturePipeline.vertexBuffers) {
              /** @type {string} */
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
                this.spaceData.cameraRenderData.cameraBuffer,
                renderData.boneBuffer,
              ],
            );
            mainRenderPass.setBindGroup(0, bindGroup);
            mainRenderPass.setPipeline(armaturePipeline.pipeline);
            mainRenderPass.draw(5, armature.bones.length);
          } else {
            console.warn("アーマチュアオーバレイ表示ようのパイプライン1がありません");
          }

          if (editor.editorState.activeObject === armature.model) {
            const armatureState = editor.editorState.getModelStateByID(armature.id,);
            if (!(armatureState instanceof ArmatureState)) continue ;

            const boneVertexPipeline = pipelineManager.getPipelineByID("Overlay-ArmatureVertex");
            if (boneVertexPipeline) {
              const bindGroup = simpleWebGPU.createGroup(
                boneVertexPipeline.groupLayout,
                [
                  this.spaceData.cameraRenderData.cameraBuffer,
                  renderData.boneVertexBuffer,
                  simpleWebGPU.createBuffer(
                      4 * 4,
                      ["U"],
                      new Float32Array([1, 0, 0, 1]),
                    ),
                ],
              );
              mainRenderPass.setBindGroup(0, bindGroup);
              mainRenderPass.setPipeline(boneVertexPipeline.pipeline);
              mainRenderPass.draw(4, armature.bones.length * 2);

              if (armatureState.selectedVertexNum) {
                const bindGroup = simpleWebGPU.createGroup(
                  boneVertexPipeline.groupLayout,
                  [
                    this.spaceData.cameraRenderData.cameraBuffer,
                    renderData.selectBoneVertexBuffer,
                    simpleWebGPU.createBuffer(
                      4 * 4,
                      ["U"],
                      new Float32Array([1, 1, 1, 1]),
                    ),
                  ],
                );
                mainRenderPass.setBindGroup(0, bindGroup);
                mainRenderPass.setPipeline(boneVertexPipeline.pipeline);
                mainRenderPass.draw(4, armatureState.selectedVertexNum, 0);
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
        const renderData = this.spaceData.getRenderData(sprite.id);
        if (!(renderData instanceof View_SpriteRenderData)) return ;
        if (!(renderData.indexBuffer)) return ;

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
              this.spaceData.cameraRenderData.cameraBuffer,
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
        const renderData = this.spaceData.getRenderData(armature.id);
        if (!(renderData instanceof View_ArmatureRenderData)) return ;
        if (!(renderData.boneBuffer)) return ;

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
              this.spaceData.cameraRenderData.cameraBuffer,
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

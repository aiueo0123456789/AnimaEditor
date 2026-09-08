import { Model_Armature } from "../../../../core/project/model/Armature";
import { Model_Sprite } from "../../../../core/project/model/Sprite";
import { SetVec2Command } from "../../../../editor/command/SetVec2";
import { AnimaEditor } from "../../../../editor/Editor";
import { ArmatureState } from "../../../../editor/editorState/state/Armature";
import { SpriteState } from "../../../../editor/editorState/state/Sprite";
import { CommandManager } from "../../../../manager/CommandManager";
import { InputManager } from "../../../../manager/InputManager";
import { PipelineManager } from "../../../../manager/PipelineManager";
import { simpleWebGPU } from "../../../../util/simpleWebGPU";
import { Vec2, Vec2Math } from "../../../../util/vecMath";
import { UIComponent_View } from "../View";
import { Tool } from "./Tool";

export class TranslateTool extends Tool {
  public movement: Vec2;
  public baseVertices: Record<number, Vec2>;
  public setCommands: Record<number, SetVec2Command>;
  public pivotPoint: Vec2;
  public buffer: GPUBuffer;

  constructor() {
    super();
    this.movement = Vec2Math.create();
    this.baseVertices = {};
    this.setCommands = {};

    this.pivotPoint = Vec2Math.create();
    this.buffer = simpleWebGPU.createBuffer((2 + 1 + 1) * 4, ["U"]);
  }

  public override activate(): void {
    Vec2Math.clear(this.movement);
    this.baseVertices = {};
    this.setCommands = {};
  }

  public override deactivate(): void {
  }

  public override update(editor: AnimaEditor, view: UIComponent_View): void {
    const inputManager = editor.getManager(InputManager);
    const commandManager = editor.getManager(CommandManager);
    if (!inputManager || !commandManager) return ;
    const activeObject = editor.editorState.activeObject;
    if (!activeObject) return ;

    if (inputManager.getKeyDown("Mouse0")) {
      Vec2Math.clear(this.movement);
      this.baseVertices = {};
      this.setCommands = {};
      commandManager.setCommandRecorder();
    }
    if (inputManager.getKey("Mouse0")) {
      // pointerMove
      Vec2Math.add(
        this.movement,
        view.clientVecToWorldVec(inputManager.mouseMovement),
        this.movement,
      );

      const state = editor.editorState.getModelStateByID(activeObject.id);
      if (activeObject instanceof Model_Sprite && state instanceof SpriteState) {
        for (const selectVertexIndex of state.selectedVertexIndices) {
          if (!this.baseVertices[selectVertexIndex]) {
            this.baseVertices[selectVertexIndex] = Vec2Math.copy(activeObject.vertices[selectVertexIndex].co);
            this.setCommands[selectVertexIndex] = commandManager.createCommand(SetVec2Command);

            this.setCommands[selectVertexIndex].set(
              activeObject.vertices,
              selectVertexIndex,
              activeObject.vertices[selectVertexIndex].co,
            );
          }
          this.setCommands[selectVertexIndex].update(Vec2Math.add(this.baseVertices[selectVertexIndex], this.movement));
        }
      } else if (activeObject instanceof Model_Armature && state instanceof ArmatureState) {
        for (const bi of state.selectedHead) {
          const vi = bi * 2;
          if (!this.baseVertices[vi]) {
            this.baseVertices[vi] = Vec2Math.copy(activeObject.bones[bi].head);
            this.setCommands[vi] = commandManager.createCommand(SetVec2Command);

            this.setCommands[vi].set(
              activeObject.bones[bi],
              "head",
              activeObject.bones[bi].head,
            );
          }
          this.setCommands[vi].update(Vec2Math.add(this.baseVertices[vi], this.movement));
        }
        for (const bi of state.selectedTail) {
          const vi = bi * 2 + 1;
          if (!this.baseVertices[vi]) {
            this.baseVertices[vi] = Vec2Math.copy(activeObject.bones[bi].tail);
            this.setCommands[vi] = commandManager.createCommand(SetVec2Command);

            this.setCommands[vi].set(
              activeObject.bones[bi],
              "tail",
              activeObject.bones[bi].tail,
            );
          }
          this.setCommands[vi].update(Vec2Math.add(this.baseVertices[vi], this.movement));
        }
      }
    }

    if (inputManager.getKeyUp("Mouse0")) {
      const recorder = commandManager.createCommandRecorder();
      for (const key in this.setCommands) {
        recorder.appendCommand(this.setCommands[key]);
      }
      commandManager.appendCommandRecorder(recorder);
    }
  }

  drawOverlay(editor: AnimaEditor, view: UIComponent_View, renderPass: GPURenderPassEncoder) {
    const pipelineManager = editor.getManager(PipelineManager);
    if (!pipelineManager) return ;
    const translateOverlayPipeline = pipelineManager.getPipelineByID("Overlay-Tool_TranslateOverlay");
    if (translateOverlayPipeline) {
      renderPass.setBindGroup(
        0,
        simpleWebGPU.createGroup(translateOverlayPipeline.groupLayout, [
          view.spaceData.cameraRenderData.cameraBuffer,
        ]),
      );
      renderPass.setPipeline(translateOverlayPipeline.pipeline);
      renderPass.draw(4, 1, 0);
    } else {
      console.warn("パイプライン: Overlay-Tool_TranslateOverlay が見つかりません")
    }
  }
}

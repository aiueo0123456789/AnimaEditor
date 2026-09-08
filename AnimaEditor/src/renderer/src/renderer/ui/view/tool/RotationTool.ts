import { Model_Sprite } from "../../../../core/project/model/Sprite";
import { SetVec2Command } from "../../../../editor/command/SetVec2";
import { AnimaEditor } from "../../../../editor/Editor";
import { SpriteState } from "../../../../editor/editorState/state/Sprite";
import { CommandManager } from "../../../../manager/CommandManager";
import { InputManager } from "../../../../manager/InputManager";
import { PipelineManager } from "../../../../manager/PipelineManager";
import { simpleWebGPU } from "../../../../util/simpleWebGPU";
import { Vec2, Vec2Math } from "../../../../util/vecMath";
import { UIComponent_View } from "../View";
import { Tool } from "./Tool";

function getAngularVelocity(center: Vec2, point: Vec2, dir: Vec2): number {
  // ベクトルABを計算
  const AB = Vec2Math.sub(point, center);
  // ABベクトルの長さを取得
  const distance = Vec2Math.length(AB);
  if (distance === 0) {
    // 地点ABが同じ
    return 0.0;
  }
  // AB方向の単位ベクトル
  const AB_normalized = Vec2Math.normalize(AB);
  // Cの垂直成分（角速度成分）を求めるための外積の大きさ
  const perpendicularVelocityMagnitude = Vec2Math.cross(AB_normalized, dir);
  // 角速度の大きさを計算（|v_perpendicular| / |AB|）
  const angularVelocityMagnitude = perpendicularVelocityMagnitude / distance;
  return angularVelocityMagnitude;
}

export class RotationTool extends Tool {
  private angle: number;
  private baseVertices: Record<number, Vec2>;
  private setCommands: Record<number, SetVec2Command>;
  private pivotPoint: Vec2;
  private buffer: GPUBuffer;

  constructor() {
    super();
    this.angle = 0;
    this.baseVertices = {};
    this.setCommands = {};

    this.pivotPoint = Vec2Math.create();
    this.buffer = simpleWebGPU.createBuffer((2 + 1 + 1) * 4, ["U"]);
  }


  public override activate(): void {
  }

  public override deactivate(): void {
  }

  public override update(editor: AnimaEditor, view: UIComponent_View): void {
    const inputManager = editor.getManager(InputManager);
    const commandManager = editor.getManager(CommandManager);
    if (!inputManager || !commandManager) return ;

    if (inputManager.getKeyDown("Mouse0")) {
      this.angle = 0;
      this.baseVertices = {};
      this.setCommands = {};
    }

    const mouseWorldPosition = view.clientToWorld(inputManager.mousePosition);
    const mouseWorldMovement = view.clientVecToWorldVec(inputManager.mouseMovement);

    if (inputManager.getKey("Mouse0")) {
      this.angle += getAngularVelocity(
        this.pivotPoint,
        Vec2Math.sub(
          mouseWorldPosition,
          mouseWorldMovement
        ),
        mouseWorldMovement
      );

      const activeObject = editor.editorState.activeObject;
      if (activeObject instanceof Model_Sprite) {
        const state = editor.editorState.getModelStateByID(activeObject.id);
        if (!(state instanceof SpriteState)) return ;
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
          this.setCommands[selectVertexIndex].update(
            Vec2Math.rotate(this.baseVertices[selectVertexIndex], this.angle),
          );
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


  public override drawOverlay(editor: AnimaEditor, view: UIComponent_View, renderPass: GPURenderPassEncoder): void {
    simpleWebGPU.writeBuffer(
      this.buffer,
      new Float32Array([...this.pivotPoint, 100, this.angle]),
    );
    const pipelineManager = editor.getManager(PipelineManager);
    if (!pipelineManager) return ;
    const translateOverlayPipeline = pipelineManager.getPipelineByID("Overlay-Tool_RotationOverlay");
    if (translateOverlayPipeline) {
      renderPass.setBindGroup(
        0,
        simpleWebGPU.createGroup(translateOverlayPipeline.groupLayout, [
          view.spaceData.cameraRenderData.cameraBuffer,
          this.buffer,
        ]),
      );
      renderPass.setPipeline(translateOverlayPipeline.pipeline);
      renderPass.draw(4, 1, 0);
    } else {
      console.warn("パイプライン: Overlay-Tool_RotationOverlay が見つかりません")
    }
  }
}

import { Model_Sprite } from "../../../../core/project/model/Sprite";
import { DeleteVertexCommandBlock, DeleteVertexCommandBlockInput } from "../../../../editor/commandBlock/DeleteVertex";
import { AnimaEditor } from "../../../../editor/Editor";
import { SpriteState } from "../../../../editor/editorState/state/Sprite";
import { CommandManager } from "../../../../manager/CommandManager";
import { InputManager } from "../../../../manager/InputManager";
import { PipelineManager } from "../../../../manager/PipelineManager";
import { simpleWebGPU } from "../../../../util/simpleWebGPU";
import { UIComponent_View } from "../View";
import { Tool } from "./Tool";

export class DeleteVertexTool extends Tool {
  constructor() {
    super();
  }

  public override activate(): void {
  }

  public override deactivate(): void {
  }

  public override update(editor: AnimaEditor, view: UIComponent_View): void {
    const inputManager = editor.getManager(InputManager);
    const commandManager = editor.getManager(CommandManager);
    if (!inputManager || !commandManager) return ;

    const activeObject = editor.editorState.activeObject;
    if (!activeObject) return ;
    const modelState = editor.editorState.getModelStateByID(activeObject.id);
    if (!modelState) return ;

    const isSprite = activeObject instanceof Model_Sprite && modelState instanceof SpriteState;

    if (isSprite) {
      if (!modelState.selectedVertexIndices.length) return ;
      if (inputManager.getKeyDown("Mouse0")) {
        const recorder = commandManager.setCommandRecorder();
        recorder?.setCommandBlock(DeleteVertexCommandBlock, {
          sprite: activeObject,
          deleteVertexIndices: modelState.selectedVertexIndices,
        } as DeleteVertexCommandBlockInput)
        commandManager.finishCommandRecorder();
      }
    }
  }

  public override drawOverlay(editor: AnimaEditor, view: UIComponent_View, renderPass: GPURenderPassEncoder): void {
    const pipelineManager = editor.getManager(PipelineManager);
    if (!pipelineManager) return ;
    const translateOverlayPipeline = pipelineManager.getPipelineByID(
      "Overlay-Tool_TranslateOverlay",
    );
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
      console.warn("パイプライン: Overlay-Tool_TranslateOverlay がありません")
    }
  }
}

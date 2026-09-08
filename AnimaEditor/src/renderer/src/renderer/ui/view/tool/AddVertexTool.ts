import { Model_Sprite } from "../../../../core/project/model/Sprite";
import { PushElementCommand, PushElementCommandInput } from "../../../../editor/command/PushElement";
import { AnimaEditor } from "../../../../editor/Editor";
import { CommandManager } from "../../../../manager/CommandManager";
import { InputManager } from "../../../../manager/InputManager";
import { PipelineManager } from "../../../../manager/PipelineManager";
import { simpleWebGPU } from "../../../../util/simpleWebGPU";
import { Vec2Math } from "../../../../util/vecMath";
import { UIComponent_View } from "../View";
import { Tool } from "./Tool";

export class AddVertexTool extends Tool {
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
    if (activeObject instanceof Model_Sprite) {
      if (inputManager.getKeyDown("Mouse0")) {
        const newVertext = Model_Sprite.createVertex({co: Vec2Math.copy(view.clientToWorld(inputManager.mousePosition)),});
        const recorder = commandManager.setCommandRecorder();
        recorder?.setCommand(
          PushElementCommand,
          {
            model: activeObject,
            path: "vertices",
            newElement: newVertext,
          } as PushElementCommandInput
        );
        recorder?.finishCommand();
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

import { Tool } from "./Tool";
import { AnimaEditor } from "../../../../editor/Editor";
import { SetPropertyCommand } from "../../../../editor/command/SetProperty";
import { CommandManager } from "../../../../manager/CommandManager";
import { InputManager } from "../../../../manager/InputManager";
import { UIComponent_View } from "../View";
import { simpleWebGPU } from "../../../../util/simpleWebGPU";
import { SetActiveObjectCommandBlock, SetActiveObjectCommandBlockInput } from "../../../../editor/commandBlock/SetActiveObject";


export class ObjectSelectTool extends Tool {
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

    const mouseScreenPosition = view.clientToScreen(inputManager.mousePosition);

    if (inputManager.getKeyUp("Mouse0")) {
      const fn = async (): Promise<void> => {
        if (view.objectIDTexture) {
          const objectID = await simpleWebGPU.pickTextureColor(view.objectIDTexture, mouseScreenPosition);
          const clickObjectID = view.spaceData.numberIDtoID(objectID);
          const newActiveObject = clickObjectID ? editor.project.getModelByID(clickObjectID) : null;

          const recorder = commandManager.setCommandRecorder();
          if (!recorder) return ;
          recorder.setCommandBlock(SetActiveObjectCommandBlock, {model: newActiveObject} as SetActiveObjectCommandBlockInput);
          commandManager.finishCommandRecorder();
        }
      };
      fn();
    }
  }

  public override drawOverlay(editorContext, uiContext, renderPass): void {
    // const pipelineManager = editorContext.getAssetsManager(PipelineManager);
    // const translateOverlayPipeline = pipelineManager.getPipelineByID(
    //   "Overlay-Tool_RotationOverlay",
    // );
    // renderPass.setBindGroup(
    //   0,
    //   simpleWebGPU.createGroup(translateOverlayPipeline.groupLayout, [
    //     uiContext.cameraBuffer,
    //   ]),
    // );
    // renderPass.setPipeline(translateOverlayPipeline.pipeline);
    // renderPass.draw(4, 1, 0);
  }
}

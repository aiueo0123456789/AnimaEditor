import { Model_Edge, Model_Sprite } from "../../../../core/project/model/Sprite";
import { ConcatArrayCommand, ConcatArrayCommandInput } from "../../../../editor/command/ConcatArray";
import { PushElementCommand } from "../../../../editor/command/PushElement";
import { AnimaEditor } from "../../../../editor/Editor";
import { SpriteState } from "../../../../editor/editorState/state/Sprite";
import { CommandManager } from "../../../../manager/CommandManager";
import { InputManager } from "../../../../manager/InputManager";
import { PipelineManager } from "../../../../manager/PipelineManager";
import { simpleWebGPU } from "../../../../util/simpleWebGPU";
import { Vec2Math } from "../../../../util/vecMath";
import { UIComponent_View } from "../View";
import { Tool } from "./Tool";

export class AddEdgeTool extends Tool {
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
      if (inputManager.getKeyDown("Mouse0")) {
        if (modelState.selectedVertexIndices.length < 2) {
          console.log("二つ以上の頂点を選択");
          return ;
        }
        const newEdges: Model_Edge[] = [];
        let lastVertex = modelState.selectedVertexIndices[0];
        for (const selectedVertexIndex of modelState.selectedVertexIndices.slice(1)) {
          newEdges.push(Model_Sprite.createEdge({vertices: [activeObject.vertices[lastVertex].id, activeObject.vertices[selectedVertexIndex].id]}));
          lastVertex = selectedVertexIndex;
        }
        const recorder = commandManager.setCommandRecorder("addEdges");
        recorder?.setCommand(ConcatArrayCommand, {
          model: activeObject,
          path: "edges",
          newElements: newEdges
        } as ConcatArrayCommandInput);
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

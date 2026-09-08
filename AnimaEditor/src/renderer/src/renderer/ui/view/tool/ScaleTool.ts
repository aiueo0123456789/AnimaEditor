import { PipelineManager } from "../../manager/PipelineManager";
import { ViewContext } from "../../renderer/ui/view/View";
import { simpleWebGPU } from "../../simpleWebGPU";
import { Vec2 } from "../../vecMath";
import { EditorContext } from "../Editor";
import { Tool } from "./Tool";

export class ScaleTool extends Tool {
  constructor() {
    super();
    this.dragging = false;
    this.movement = Vec2.create();
  }

  activate() {
    this.dragging = false;
    Vec2.clear(this.movement);
  }

  /**
   *
   * @param {EditorContext} editorContext
   */
  update(editorContext) {
    const inputManager = editorContext.inputManager;
    if (
      0 < inputManager.mouseMovement[0] &&
      0 < inputManager.mouseMovement[1]
    ) {
      // pointerMove
    }
  }

  /**
   *
   * @param {EditorContext} editorContext
   * @param {ViewContext} uiContext
   * @param {*} renderPass
   */
  drawOverlay(editorContext, uiContext, renderPass) {
    const pipelineManager = editorContext.getAssetsManager(PipelineManager);
    const translateOverlayPipeline = pipelineManager.getPipelineByID(
      "Overlay-Tool_TranslateOverlay",
    );
    renderPass.setBindGroup(
      0,
      simpleWebGPU.createGroup(translateOverlayPipeline.groupLayout, [
        uiContext.cameraBuffer,
      ]),
    );
    renderPass.setPipeline(translateOverlayPipeline.pipeline);
    renderPass.draw(4, 1, 0);
  }
}

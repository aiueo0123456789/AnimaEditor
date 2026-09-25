import type { AnimaEditor } from "../../../../editor/Editor";
import type { UIComponent_View } from "../View";

export class Tool {
  public readonly isTool = true;
  public activate(): void {}
  public deactivate(): void {}
  public update(_editor: AnimaEditor, _view: UIComponent_View): void {}
  public drawOverlay(_editor: AnimaEditor, _view: UIComponent_View, _renderPass: GPURenderPassEncoder): void {}
}

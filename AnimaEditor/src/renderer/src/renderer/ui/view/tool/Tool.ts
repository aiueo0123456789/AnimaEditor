import type { AnimaEditor } from "../../../../editor/Editor";
import type { Widget } from "../../../../manager/ui/components";
import type { UIComponent_View } from "../View";

export class Tool {
  public readonly isTool = true;
  public readonly id: string = "";
  public readonly label: string = "";
  public readonly icon: string = "";
  public uiVersion = 0;

  protected changed(): void { this.uiVersion++; }
  public activate(): void {}
  public deactivate(): void {}
  public update(_editor: AnimaEditor, _view: UIComponent_View): void {}
  public drawOverlay(_editor: AnimaEditor, _view: UIComponent_View, _renderPass: GPURenderPassEncoder): void {}
  public createParamsWidget(_editor: AnimaEditor): Widget | null { return null; }
}

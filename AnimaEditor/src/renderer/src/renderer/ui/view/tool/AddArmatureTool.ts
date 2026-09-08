import { ModelNames } from "../../../../core/project/Project";
import { AnimaEditor } from "../../../../editor/Editor";
import { CommandManager } from "../../../../manager/CommandManager";
import { InputManager } from "../../../../manager/InputManager";
import { UIComponent_View } from "../View";
import { Tool } from "./Tool";

export class AddArmatureTool extends Tool {
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

    if (inputManager.getKeyDown("Mouse0")) {
      // const recorder = commandManager.createCommandRecorder();
      const armature = editor.addArmature({
        modelName: ModelNames.Aramature,
        name: "名称未設定",
        bones: [
          {
            head: [0, 0],
            tail: [0, 200],
            name: "ボーン0",
          }
        ]
      });
    }
  }

  public override drawOverlay(editor: AnimaEditor, view: UIComponent_View, renderPass: GPURenderPassEncoder): void {
  }
}
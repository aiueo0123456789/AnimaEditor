import { Model_Sprite } from "../../../../core/project/model/Sprite";
import { SetPropertyCommand } from "../../../../editor/command/SetProperty";
import { AnimaEditor } from "../../../../editor/Editor";
import { SpriteState } from "../../../../editor/editorState/state/Sprite";
import { CommandManager, CommandRecorder } from "../../../../manager/CommandManager";
import { InputManager } from "../../../../manager/InputManager";
import { Vec2Math } from "../../../../util/vecMath";
import { UIComponent_View } from "../View";
import { Tool } from "./Tool";

export class WeightPaintTool extends Tool {
  public setWeightCommands: SetPropertyCommand[];
  public commandRecorder: CommandRecorder | null;
  constructor() {
    super();
    this.setWeightCommands = [];
    this.commandRecorder = null;
  }

  public override activate(...args: unknown[]): void {
    
  }

  public override deactivate(...args: unknown[]): void {
    
  }

  public override update(editor: AnimaEditor, view: UIComponent_View) {
    const inputManager = editor.getManager(InputManager);
    const commandManager = editor.getManager(CommandManager);
    if (!inputManager || !commandManager) return ;

    const activeObject = editor.editorState.activeObject;
    if (!activeObject) return ;
    const modelState = editor.editorState.getModelStateByID(activeObject.id);
    if (!modelState) return ;

    const isSprite = activeObject instanceof Model_Sprite && modelState instanceof SpriteState;

    const mouseWorldPosition = view.clientToWorld(inputManager.mousePosition);
    if (!isSprite) return ;
    const activeBoneWight = activeObject.boneWeights.find(boneWeight => boneWeight.id == modelState.activeBoneWeightBoneID);
    if (!activeBoneWight) return ;
    if (inputManager.getKeyDown("Mouse0")) {
      this.setWeightCommands = activeBoneWight?.weights.map((weight, vi) => {
        const setPropertyCommand = commandManager.createCommand(SetPropertyCommand);
        setPropertyCommand.set(activeBoneWight?.weights, vi, weight);
        this.commandRecorder?.appendCommand(setPropertyCommand);
        return setPropertyCommand;
      }) ?? [];
      this.commandRecorder = commandManager.createCommandRecorder();
    }

    if (!this.commandRecorder) return ;

    if (inputManager.getKey("Mouse0")) {
      this.setWeightCommands.forEach((setPropertyCommand, vi) => {
        const vertexCo = activeObject.vertices[vi].co;
        const dist = Vec2Math.distance(vertexCo, mouseWorldPosition);
        const maxDist = 100;
        const weightValue = 1;
        const paintValue = weightValue / ((1 - dist / maxDist) ** 2);
        setPropertyCommand.update(paintValue);
      })
    }
    if (inputManager.getKeyUp("Mouse0")) {
      commandManager.appendCommandRecorder(this.commandRecorder);
    }
  }

  public override drawOverlay(editor: AnimaEditor, view: UIComponent_View, renderPass) {
  }
}

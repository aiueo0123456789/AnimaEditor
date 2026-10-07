import { Tool } from "./Tool";
import type { AnimaEditor } from "../../../../editor/Editor";
import { InputManager } from "../../../../manager/InputManager";
import type { UIComponent_View } from "../View";
import { simpleWebGPU } from "../../../../util/simpleWebGPU";
import { CommandManager } from "../../../../manager/CommandManager";
import { commitUIActiveObject } from "../../../../manager/ui/commands";
import { Model_Armature } from "../../../../core/project/model/Armature";
import { Model_Sprite } from "../../../../core/project/model/Sprite";

export class ObjectSelectTool extends Tool {
  public override readonly id = "objectSelect";
  public override readonly label = "オブジェクト選択";
  public override readonly icon = "select";
  private version = 0;
  public override deactivate(): void { this.version++; }
  public override update(editor: AnimaEditor, view: UIComponent_View): void {
    const input = editor.getManager(InputManager);
    if (!input?.getKeyUp("Mouse0") || !view.objectIDTexture) return;
    const version = ++this.version;
    const project = editor.project;
    const texture = view.objectIDTexture;
    const position = view.clientToScreen(input.mousePosition);
    const additive = input.getKey("ShiftLeft") || input.getKey("ShiftRight") || input.getKey("MetaLeft") || input.getKey("ControlLeft");
    if (position.some(value => value < 0 || value >= 1)) return;
    void simpleWebGPU.pickTextureColor(texture, position).then(objectID => {
      if (version !== this.version || editor.project !== project || view.objectIDTexture !== texture) return;
      const id = view.spaceData.renderData.numberIDtoID(objectID);
      const model = id ? project.getModelByID(id) : null;
      const commands = editor.getManager(CommandManager);
      if (model !== null && !(model instanceof Model_Armature) && !(model instanceof Model_Sprite)) return;
      if (commands) commitUIActiveObject(commands, model, additive);
    }).catch(error => { if (version === this.version && texture === view.objectIDTexture) console.error("Object picking failed", error); });
  }
}

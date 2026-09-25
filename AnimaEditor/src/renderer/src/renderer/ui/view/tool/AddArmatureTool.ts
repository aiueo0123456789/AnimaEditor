import type { AnimaEditor } from "../../../../editor/Editor";
import type { UIComponent_View } from "../View";
import { InputManager } from "../../../../manager/InputManager";
import { Tool } from "./Tool";
import { editOnce } from "./editOnce";
import { ModelNames } from "../../../../core/project/Project";
export class AddArmatureTool extends Tool {
  public override update(editor: AnimaEditor, view: UIComponent_View): void {
    const input = editor.getManager(InputManager);
    if (!input?.getKeyDown("Mouse0")) return;
    editOnce(editor, "Add armature", () => {
      const head = view.clientToWorld(input.mousePosition);
      const boneID = crypto.randomUUID();
      const { model, runtime, state } = editor.createArmature({ modelName: ModelNames.Aramature, name: "Armature",
        bones: { [boneID]: { head, tail: [head[0], head[1] + 100 / view.camera.zoom], name: "Bone" } } });
      return [
        { model: editor.project, path: "models", value: [...editor.project.models, model] },
        { model: editor.projectCache, path: "runtimes", value: [...editor.projectCache.runtimes, runtime] },
        { model: editor.editorState, path: "states", value: [...editor.editorState.states, state] },
        { model: editor.editorState, path: "activeObject", value: model },
      ];
    });
  }
}

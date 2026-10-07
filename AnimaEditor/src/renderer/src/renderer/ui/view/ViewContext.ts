import { ModelNames, type Models } from "../../../core/project/Project";
import type { AnimaEditor } from "../../../editor/Editor";
import { SetSelectionCommand } from "../../../editor/command/interactionCommand/SetSelectionCommand";
import { PushElementCommand } from "../../../editor/command/primitiveCommand/PushElement";
import { CommandManager } from "../../../manager/CommandManager";
import { Color, ColorMath } from "../../../util/color";
import type { Vec2 } from "../../../util/vecMath";

export type ViewObjectKind = "sprite" | "armature" | "animation";

export function addViewObject(editor: AnimaEditor, kind: ViewObjectKind, position: Vec2, boneLength = 100): Models | null {
  const manager = editor.getManager(CommandManager);
  if (!manager || manager.commandRecorder) return null;

  const created = kind === "sprite"
    ? editor.createSprite({
        modelName: ModelNames.Sprite,
        name: "Sprite",
        texture: { modelID: "" },
        zIndex: 0,
        vertices: {},
        silhouetteEdges: {},
        edges: {},
        boneWeights: {},
      })
    : kind === "armature"
      ? (() => {
        const groupID = crypto.randomUUID();
        const boneID = crypto.randomUUID();
          return editor.createArmature({
            modelName: ModelNames.Aramature,
            name: "Armature",
            groups: { [groupID]: { name: "グループ1", color: ColorMath.create(1,0,0) as Color } },
            bones: { [boneID]: { name: "Bone", head: [...position], tail: [position[0], position[1] + boneLength], parentID: {aramatureID: "", boneID: ""}, groupID: groupID } },
          });
        })()
      : editor.createAnimation({ modelName: ModelNames.Animation, name: "Animation", tracks: {} });

  const recorder = manager.setCommandRecorder(`Add ${kind}`);
  if (!recorder) return null;
  const record = (Command: new (...args: any[]) => any, data: any): boolean => {
    recorder.setCommand(Command, data);
    if (!recorder.command) return false;
    recorder.commitCommand();
    return true;
  };
  const complete = record(PushElementCommand, { model: editor.project, path: "models", newElement: created.model }) &&
    record(PushElementCommand, { model: editor.projectCache, path: "runtimes", newElement: created.runtime }) &&
    record(PushElementCommand, { model: editor.editorState, path: "states", newElement: created.state }) &&
    record(SetSelectionCommand, { domain: kind === "animation" ? "animations" : "objects", id: created.model.id });
  if (!complete) {
    manager.cancelCommandRecorder();
    return null;
  }
  manager.commitCommandRecorder();
  return created.model;
}

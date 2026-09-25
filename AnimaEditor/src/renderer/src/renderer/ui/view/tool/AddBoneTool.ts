import { Model_Armature, type Model_Bone } from "../../../../core/project/model/Armature";
import { ArmatureState } from "../../../../editor/editorState/state/States/Armature";
import { AddDictionaryValuesCommand } from "../../../../editor/command/interactionCommand/AddDictionaryValuesCommand";
import type { AnimaEditor } from "../../../../editor/Editor";
import type { CommandRecorder } from "../../../../manager/CommandManager";
import type { InputManager } from "../../../../manager/InputManager";
import type { UIComponent_View } from "../View";
import { Vec2Math } from "../../../../util/vecMath";
import { DragTool } from "./DragTool";
export class AddBoneTool extends DragTool {
  private additions: { key: string; value: Model_Bone }[] = [];
  protected start(editor: AnimaEditor, _view: UIComponent_View, recorder: CommandRecorder): void {
    const model = editor.editorState.activeObject;
    if (!(model instanceof Model_Armature)) return;
    const state = editor.editorState.getModelStateByID(model.id);
    if (!(state instanceof ArmatureState)) return;
    this.additions = [];
    for (const [indices, part] of [[state.selectedTailIDs, "tail"], [state.selectedHeadIDs, "head"]] as const)
      for (const id of new Set(indices)) {
        const parent = model.bones[id];
        if (parent) this.additions.push({ key: crypto.randomUUID(), value: Model_Armature.createBone({ name: "Bone", head: [...parent[part]], tail: [...parent[part]],
          parentID: { aramatureID: model.id, boneID: id } }) });
      }
    if (!this.additions.length) this.additions.push({ key: crypto.randomUUID(), value: Model_Armature.createBone({ name: "Bone", head: [...this.origin], tail: [...this.origin] }) });
    recorder.setCommand(AddDictionaryValuesCommand, { model, path: "bones", values: this.additions });
  }
  protected move(_editor: AnimaEditor, view: UIComponent_View, input: InputManager, recorder: CommandRecorder): void {
    const movement = Vec2Math.sub(view.clientToWorld(input.mousePosition), this.origin);
    const bones = this.additions.map(({ key, value: bone }) => ({ key, value: Model_Armature.createBone({ ...bone, parentID: bone.parentID ?? undefined,
      head: [...bone.head], tail: Vec2Math.add(bone.head, movement) }) }));
    recorder.updateCommand({ values: bones });
  }
}

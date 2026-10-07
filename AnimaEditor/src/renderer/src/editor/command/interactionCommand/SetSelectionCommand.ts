import { Model_Animation } from "../../../core/project/model/Animation";
import { Model_Armature } from "../../../core/project/model/Armature";
import { Model_Sprite } from "../../../core/project/model/Sprite";
import { Model_Texture } from "../../../core/project/model/Texture";
import type { SelectionDomain } from "../../editorState/Selection";
import { ViewEditModes } from "../../editorState/ViewEditModes";
import type { AnimaEditor, ID } from "../../Editor";
import { CommandReturn } from "../primitiveCommand/PrimitiveCommand";
import { updatePreview } from "../updatePreview";
import { InteractionCommand } from "./InteractionCommand";

export interface SetSelectionCommandInput { domain: SelectionDomain; id: ID | null; additive?: boolean; }
export class SetSelectionCommand extends InteractionCommand {
  private data: SetSelectionCommandInput;
  private previous: { path: string; value: unknown }[] = [];
  constructor(editor: AnimaEditor, data: SetSelectionCommandInput) { super(editor, data); this.data = { ...data }; }
  public begin(): CommandReturn {
    if (this.commited || !this.valid(this.data)) return CommandReturn.ERROR;
    const state = this.editor.editorState;
    this.previous = ["objects", "animations", "textures"].flatMap(domain =>
      Object.entries(state[domain]).map(([key, value]) => ({ path: `${domain}.${key}`, value: structuredClone(value) })));
    this.previous.push({ path: "inspectorDomain", value: state.inspectorDomain }, { path: "editMode", value: state.editMode });
    return this.redo();
  }
  private valid(data: SetSelectionCommandInput): boolean {
    if (data.id === null) return true;
    const model = this.editor.project.getModelByID(data.id);
    return data.domain === "objects" ? model instanceof Model_Armature || model instanceof Model_Sprite
      : data.domain === "animations" ? model instanceof Model_Animation : model instanceof Model_Texture;
  }
  public update(data: SetSelectionCommandInput): CommandReturn {
    if (!this.valid(data)) return CommandReturn.ERROR;
    return updatePreview(this, () => { this.data = { ...data }; });
  }
  public redo(): CommandReturn {
    if (!this.valid(this.data)) return CommandReturn.ERROR;
    const state = this.editor.editorState;
    const { domain, id, additive } = this.data;
    const active = domain === "objects" ? "activeObjectID" : domain === "animations" ? "activeAnimationID" : "activeTextureID";
    let activeID = id;
    if (domain !== "textures") {
      const selected = domain === "objects" ? "selectedObjectsID" : "selectedAnimationsID";
      const old = domain === "objects" ? state.objects.selectedObjectsID : state.animations.selectedAnimationsID;
      const ids = id === null ? [] : additive ? old.includes(id) ? old.filter(item => item !== id) : [...new Set([...old, id])] : [id];
      activeID = id !== null && ids.includes(id) ? id : ids.at(-1) ?? null;
      this.api.setProperty(state, `${domain}.${selected}`, ids);
    }
    this.api.setProperty(state, `${domain}.${active}`, activeID);
    this.api.setProperty(state, "inspectorDomain", domain);
    if (domain === "objects") {
      const modes = state.getModelStateByID(activeID ?? "")?.availableModes ?? [ViewEditModes.OBJECT];
      if (!modes.includes(state.editMode)) this.api.setProperty(state, "editMode", ViewEditModes.OBJECT);
    }
    return CommandReturn.FINISHED;
  }
  public undo(): CommandReturn {
    for (const entry of this.previous) this.api.setProperty(this.editor.editorState, entry.path, structuredClone(entry.value));
    return CommandReturn.FINISHED;
  }
  public cancel(): CommandReturn { return this.commited ? CommandReturn.ERROR : this.undo(); }
}

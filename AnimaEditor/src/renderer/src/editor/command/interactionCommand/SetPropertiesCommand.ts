import type { AnimaEditor } from "../../Editor";
import { InteractionCommand } from "./InteractionCommand";
import { CommandReturn } from "../primitiveCommand/PrimitiveCommand";
import { updatePreview } from "../updatePreview";

import type { PropertyRoot } from "../PropertyRoot";
export interface PropertyEdit { model: PropertyRoot; path: string; value: unknown; }
export interface SetPropertiesUpdate { values: unknown[]; }
// One live preview for coupled properties, such as head/tail selection.
export class SetPropertiesCommand extends InteractionCommand {
  private edits: PropertyEdit[];
  private before: unknown[] = [];
  private after: unknown[];
  constructor(editor: AnimaEditor, data: { edits: PropertyEdit[] }) {
    super(editor, data);
    this.edits = data.edits.map(edit => ({ ...edit }));
    this.after = this.edits.map(edit => this.copy(edit.value));
  }
  private copy(value: unknown): unknown { return Array.isArray(value) ? [...value] : value; }
  public begin(): CommandReturn {
    this.before = this.edits.map(edit => this.copy(this.api.getProperty(edit.model, edit.path)));
    return this.redo();
  }
  public update(data: SetPropertiesUpdate): CommandReturn {
    if (data.values.length !== this.edits.length) return CommandReturn.ERROR;
    return updatePreview(this, () => { this.after = data.values.map(value => this.copy(value)); });
  }
  private apply(values: unknown[], reverse = false): CommandReturn {
    const indices = this.edits.map((_edit, index) => index);
    if (reverse) indices.reverse();
    indices.forEach(index => {
      const edit = this.edits[index];
      const value = values[index];
      if (Array.isArray(value) && Array.isArray(this.api.getProperty(edit.model, edit.path))) this.api.setElements(edit.model, edit.path, [...value]);
      else this.api.setProperty(edit.model, edit.path, value);
    });
    return CommandReturn.FINISHED;
  }
  public redo(): CommandReturn { return this.apply(this.after); }
  public undo(): CommandReturn { return this.apply(this.before, true); }
  public cancel(): CommandReturn { return this.commited ? CommandReturn.ERROR : this.undo(); }
}

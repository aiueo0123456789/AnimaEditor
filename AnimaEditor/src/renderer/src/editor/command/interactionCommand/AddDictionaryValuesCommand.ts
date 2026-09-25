import type { AnimaEditor } from "../../Editor";
import type { PropertyRoot } from "../PropertyRoot";
import { CommandReturn } from "../primitiveCommand/PrimitiveCommand";
import { updatePreview } from "../updatePreview";
import { InteractionCommand, type InteractionCommandInput } from "./InteractionCommand";

export interface DictionaryValue {
  key: string;
  value: unknown;
}

export interface AddDictionaryValuesCommandInput extends InteractionCommandInput {
  model: PropertyRoot;
  path: string;
  values: DictionaryValue[];
}

export interface AddDictionaryValuesCommandUpdate {
  values: DictionaryValue[];
}

export class AddDictionaryValuesCommand extends InteractionCommand {
  private model: PropertyRoot;
  private path: string;
  private values: DictionaryValue[];

  constructor(editor: AnimaEditor, data: AddDictionaryValuesCommandInput) {
    super(editor, data);
    this.model = data.model;
    this.path = data.path;
    this.values = data.values.map(item => ({ ...item }));
  }

  private dictionary(): Record<string, unknown> | null {
    const value = this.api.getProperty(this.model, this.path);
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  }

  public begin(): CommandReturn {
    const dictionary = this.dictionary();
    if (!dictionary || this.values.some(item => Object.prototype.hasOwnProperty.call(dictionary, item.key)))
      return CommandReturn.ERROR;
    return this.redo();
  }

  public update(data: AddDictionaryValuesCommandUpdate): CommandReturn {
    if (data.values.length !== this.values.length ||
        data.values.some((item, index) => item.key !== this.values[index].key)) return CommandReturn.ERROR;
    const values = data.values.map(item => ({ ...item }));
    return updatePreview(this, () => { this.values = values; });
  }

  public redo(): CommandReturn {
    const dictionary = this.dictionary();
    if (!dictionary || this.values.some(item => Object.prototype.hasOwnProperty.call(dictionary, item.key)))
      return CommandReturn.ERROR;
    for (const item of this.values) this.api.addToDictionary(this.model, this.path, item.key, item.value);
    return CommandReturn.FINISHED;
  }

  public undo(): CommandReturn {
    const dictionary = this.dictionary();
    if (!dictionary || this.values.some(item => !Object.prototype.hasOwnProperty.call(dictionary, item.key)))
      return CommandReturn.ERROR;
    for (const item of [...this.values].reverse()) {
      this.api.deleteInDictionary(this.model, this.path, item.key);
    }
    return CommandReturn.FINISHED;
  }

  public cancel(): CommandReturn {
    return this.commited ? CommandReturn.ERROR : this.undo();
  }
}

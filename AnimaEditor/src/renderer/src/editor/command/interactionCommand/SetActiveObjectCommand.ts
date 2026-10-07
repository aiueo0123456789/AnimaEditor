import type { Model_Armature } from "../../../core/project/model/Armature";
import type { Model_Sprite } from "../../../core/project/model/Sprite";
import { AnimaEditor } from "../../Editor";
import { SetSelectionCommand, type SetSelectionCommandInput } from "./SetSelectionCommand";

export interface SetActiveObjectCommandInput {
  newActiveObject: Model_Armature | Model_Sprite | null;
  additive?: boolean;
}

export type SetActiveObjectCommandUpdate = SetActiveObjectCommandInput;

export class SetActiveObjectCommand extends SetSelectionCommand {
  constructor(editor: AnimaEditor, data: SetActiveObjectCommandInput) {
    super(editor, { domain: "objects", id: data.newActiveObject?.id ?? null, additive: data.additive });
  }

  public override update(data: SetActiveObjectCommandUpdate | SetSelectionCommandInput) {
    return super.update("domain" in data ? { ...data, domain: "objects" }
      : { domain: "objects", id: data.newActiveObject?.id ?? null, additive: data.additive });
  }
}

import { Models } from "../../core/project/Project";
import { SetPropertyCommand, SetPropertyCommandInput } from "../command/SetProperty";
import { AnimaEditor } from "../Editor";
import { CommandBlock, CommandData } from "./CommandBlock";

export interface SetActiveObjectCommandBlockInput {
  model: Models
}

export class SetActiveObjectCommandBlock extends CommandBlock {
  constructor(editor: AnimaEditor) {
    super(editor);
  }

  public set(data: SetActiveObjectCommandBlockInput) {
    const model = data.model;
    const addModelCommand = new CommandData(
      SetPropertyCommand,
      {
        model: this.editor.editorState,
        path: "activeObject",
        newValue: model
      } as SetPropertyCommandInput
    );
    this.commandDatas.push(addModelCommand);
  }
}
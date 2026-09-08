import { Model_AnimationInput } from "../../core/project/model/Animation";
import { Model_ArmatureInput } from "../../core/project/model/Armature";
import { Model_SpriteInput } from "../../core/project/model/Sprite";
import { Model_TextureInput } from "../../core/project/model/Texture";
import { PushElementCommand, PushElementCommandInput } from "../command/PushElement";
import { AnimaEditor } from "../Editor";
import { CommandBlock, CommandData } from "./CommandBlock";

export interface AddObjectCommandBlockInput {
  modelData: Model_AnimationInput | Model_ArmatureInput | Model_TextureInput | Model_SpriteInput
}

export class AddObjectCommandBlock extends CommandBlock {
  constructor(editor: AnimaEditor) {
    super(editor);
  }

  public set(data: AddObjectCommandBlockInput) {
    const {model: newModel, runtime: newRuntime, state: newState} = this.editor.createModel(data.modelData);
    const addModelCommand = new CommandData(
      PushElementCommand,
      {
        model: this.editor.project,
        path: "models",
        newElement: newModel
      } as PushElementCommandInput
    );
    this.commandDatas.push(addModelCommand);

    const addRuntimeCommand = new CommandData(
      PushElementCommand,
      {
        model: this.editor.projectCache,
        path: "runtimes",
        newElement: newRuntime
      } as PushElementCommandInput
    );
    this.commandDatas.push(addRuntimeCommand);

    const addStateCommand = new CommandData(
      PushElementCommand,
      {
        model: this.editor.editorState,
        path: "states",
        newElement: newState
      } as PushElementCommandInput
    );
    this.commandDatas.push(addStateCommand);
  }
}
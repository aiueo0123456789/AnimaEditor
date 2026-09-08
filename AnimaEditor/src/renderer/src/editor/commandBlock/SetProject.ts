import { ProjectInput } from "../../core/project/Project";
import { PushElementCommand, PushElementCommandInput } from "../command/PushElement";
import { SetPropertyCommand, SetPropertyCommandInput } from "../command/SetProperty";
import { AnimaEditor } from "../Editor";
import { CommandBlock, CommandData } from "./CommandBlock";

export interface SetProjectCommandBlockInput {
  projectData: ProjectInput
}

export class SetProjectCommandBlock extends CommandBlock {
  constructor(editor: AnimaEditor) {
    super(editor);
  }

  public set(data: SetProjectCommandBlockInput) {
    const newProject = this.editor.createProject(data.projectData);
    const setAnimationConfigCommand = new CommandData(
      SetPropertyCommand,
      {
        model: this.editor,
        path: "project",
        newValue: newProject
      } as SetPropertyCommandInput
    );
    this.commandDatas.push(setAnimationConfigCommand);

    for (const modelData of data.projectData.models) {
      const {model: newModel, runtime: newRuntime, state: newState} = this.editor.createModel(modelData);
      const addModelCommand = new CommandData(
        PushElementCommand,
        {
          model: newProject,
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
}
import { updatePreview } from "../updatePreview";
import { Project, ProjectInput } from "../../../core/project/Project";
import { AnimaEditor } from "../../Editor";
import { CommandReturn } from "../primitiveCommand/PrimitiveCommand";
import { InteractionCommand, InteractionCommandInput } from "./InteractionCommand";
import type { EditorState } from "../../editorState/EditorState";
import { ViewEditModes } from "../../editorState/ViewEditModes";

export interface SetProjectCommandInput extends InteractionCommandInput {
  newProjectData: ProjectInput
}

export type SetProjectCommandUpdate = SetProjectCommandInput;

export class SetProjectCommand extends InteractionCommand {
  private newProject: Project;
  private newObjects: ReturnType<InstanceType<typeof AnimaEditor>["createModel"]>[];
  private oldProject: Project | null;
  private oldObjects: ReturnType<InstanceType<typeof AnimaEditor>["createModel"]>[];
  private oldSelection: Pick<EditorState, "activeObject" | "hoverObject" | "selectedObjects" | "editMode"> | null = null;
  constructor(editor: AnimaEditor, data: SetProjectCommandInput) {
    super(editor, data);
    this.newProject = editor.createProject(data.newProjectData);

    this.newObjects = [];
    for (const modelData of data.newProjectData.models) {
      this.newObjects.push(this.editor.createModel(modelData));
    }

    this.oldProject = null;
    this.oldObjects = [];
  }

  public begin(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;
    this.oldProject = this.api.getProperty(this.editor, "project") as Project;
    const state = this.editor.editorState;
    this.oldSelection = { activeObject: state.activeObject, hoverObject: state.hoverObject,
      selectedObjects: [...state.selectedObjects], editMode: state.editMode };
    this.oldObjects = this.editor.project.models.map(model => {
      return {model: model, runtime: this.editor.projectCache.getRuntimeByID(model.id), state: this.editor.editorState.getModelStateByID(model.id)};
    });
    return this.redo();
  }

  public override update(data: SetProjectCommandUpdate): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;
    const project = this.editor.createProject(data.newProjectData);
    const objects = data.newProjectData.models.map(model => this.editor.createModel(model));
    return updatePreview(this, () => {
      this.newProject = project;
      this.newObjects = objects;
    });
  }

  public override redo(): CommandReturn {
    this.api.setProperty(this.editor, "project", this.newProject);
    this.api.clearElements(this.editor.project, "models");
    this.api.clearElements(this.editor.projectCache, "runtimes");
    this.api.clearElements(this.editor.editorState, "states");
    for (const object of this.newObjects) {
      this.api.pushElement(this.editor.project, "models", object.model);
      this.api.pushElement(this.editor.projectCache, "runtimes", object.runtime);
      this.api.pushElement(this.editor.editorState, "states", object.state);
    }
    this.api.setProperty(this.editor.editorState, "activeObject", null);
    this.api.setProperty(this.editor.editorState, "hoverObject", null);
    this.api.setElements(this.editor.editorState, "selectedObjects", []);
    this.api.setProperty(this.editor.editorState, "editMode", ViewEditModes.OBJECT);
    return CommandReturn.FINISHED;
  }

  public override cancel(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;
    return this.undo();
  }

  public override undo(): CommandReturn {
    this.api.setProperty(this.editor, "project", this.oldProject);
    this.api.clearElements(this.editor.project, "models");
    this.api.clearElements(this.editor.projectCache, "runtimes");
    this.api.clearElements(this.editor.editorState, "states");
    for (const object of this.oldObjects) {
      this.api.pushElement(this.editor.project, "models", object.model);
      this.api.pushElement(this.editor.projectCache, "runtimes", object.runtime);
      this.api.pushElement(this.editor.editorState, "states", object.state);
    }
    if (this.oldSelection) {
      this.api.setProperty(this.editor.editorState, "activeObject", this.oldSelection.activeObject);
      this.api.setProperty(this.editor.editorState, "hoverObject", this.oldSelection.hoverObject);
      this.api.setElements(this.editor.editorState, "selectedObjects", [...this.oldSelection.selectedObjects]);
      this.api.setProperty(this.editor.editorState, "editMode", this.oldSelection.editMode);
    }
    return CommandReturn.FINISHED;
  }
}

import { Project } from "../../../core/project/Project";
import { AnimaEditor } from "../../../editor/Editor";
import { SourceContext } from "./SourceContext";

export class ProjectSourceContext extends SourceContext {
  public editor: AnimaEditor;
  constructor(editor: AnimaEditor) {
    super("project");
    this.editor = editor;
  }

  public override resolve(): Project | null {
    return this.editor.project;
  }
}
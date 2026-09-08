import { AnimaEditor } from "../editor/Editor";
import { ActiveObjectSourceContext } from "./context/ActiveObjectSourceContext";
import { ProjectSourceContext } from "./context/ProjectSourceContext";
import { Manager } from "./Manager";

export class ContextManager extends Manager {
  public activeObjectSourceContext: ActiveObjectSourceContext;
  public projectSourceContext: ProjectSourceContext;

  constructor(editor: AnimaEditor) {
    super(editor);
    this.activeObjectSourceContext = new ActiveObjectSourceContext(editor);
    this.projectSourceContext = new ProjectSourceContext(editor);
  }
}
import { AnimaEditor } from "../../editor/Editor";
import { ActiveObjectSourceContext, ActiveObjectStateSourceContext,  } from "./contexts/ActiveObjectSourceContext";
import { ProjectSourceContext } from "./contexts/ProjectSourceContext";
import { Manager } from "../Manager";

export class ContextManager extends Manager {
  public activeObjectStateSourceContext: ActiveObjectStateSourceContext;
  public activeObjectSourceContext: ActiveObjectSourceContext;
  public projectSourceContext: ProjectSourceContext;

  constructor(editor: AnimaEditor) {
    super(editor);
    this.activeObjectStateSourceContext = new ActiveObjectStateSourceContext(editor);
    this.activeObjectSourceContext = new ActiveObjectSourceContext(editor);
    this.projectSourceContext = new ProjectSourceContext(editor);
  }
}
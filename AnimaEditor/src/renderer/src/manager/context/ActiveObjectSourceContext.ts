import { Models } from "../../core/project/Project";
import { AnimaEditor } from "../../editor/Editor";
import { SourceContext } from "./SourceContext";

export class ActiveObjectSourceContext extends SourceContext {
  public editor: AnimaEditor;
  constructor(editor: AnimaEditor) {
    super("activeObject");
    this.editor = editor;
  }

  public override resolve(): Models | null {
    return this.editor.editorState.activeObject;
  }
}
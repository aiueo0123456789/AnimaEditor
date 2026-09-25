import { Models } from "../../../core/project/Project";
import { AnimaEditor } from "../../../editor/Editor";
import { States } from "../../../editor/editorState/EditorState";
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

export class ActiveObjectStateSourceContext extends SourceContext {
  public editor: AnimaEditor;
  constructor(editor: AnimaEditor) {
    super("activeObjectState");
    this.editor = editor;
  }

  public override resolve(): States | null {
    return this.editor.editorState.getModelStateByID(this.editor.editorState.activeObject?.id ?? "");
  }
}
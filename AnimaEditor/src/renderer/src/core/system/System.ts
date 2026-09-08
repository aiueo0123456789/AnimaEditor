import { AnimaEditor } from "../../editor/Editor";

export abstract class System {
  public isSystem: boolean;
  protected editor: AnimaEditor;

  constructor(editor: AnimaEditor) {
    this.isSystem = true;

    this.editor = editor;
  }

  /**
   * システムの最初の処理(主に初期化)
   */
  public abstract start(): void

  public abstract end(): void

  /**
   * システムの更新
   */
  public abstract update(): void
}

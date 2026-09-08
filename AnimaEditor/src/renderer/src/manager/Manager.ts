import { AnimaEditor } from "../editor/Editor";

export abstract class Manager {
  public isManager: boolean;
  protected editor: AnimaEditor;
  constructor(editor: AnimaEditor) {
    this.isManager = true;
    this.editor = editor;
  }

  // 初期化で呼ばれる
  public start(): void {
  }

  // フレームの最初に呼ばれる
  public update(): void {
  }

  // フレームの最後に呼ばれる
  public updateLate(): void {
  }
}
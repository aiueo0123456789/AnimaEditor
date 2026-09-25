import { AnimaEditor } from "../../Editor";
import { EditorAPI } from "../../EditorAPI";
import { CommandReturn } from "../primitiveCommand/PrimitiveCommand";

export interface InteractionCommandInput {}

export abstract class InteractionCommand {
  protected editor: AnimaEditor;
  protected api: EditorAPI;
  public hasError: boolean;
  public commited: boolean;

  constructor(editor: AnimaEditor, _data: InteractionCommandInput) {
    this.editor = editor;
    this.api = editor.api;
    this.hasError = false;
    this.commited = false;
  }

  public commit(): void {
    this.commited = true;
  }

  protected isCommited(): boolean {
    return this.commited || this.hasError;
  }

  public abstract begin(): CommandReturn // oldValueなどの保存

  public abstract cancel(): CommandReturn // コマンドのキャンセル

  public abstract update(...args: unknown[]): CommandReturn // 値の変更

  public abstract redo(): CommandReturn // 実行

  public abstract undo(): CommandReturn // 戻す
}

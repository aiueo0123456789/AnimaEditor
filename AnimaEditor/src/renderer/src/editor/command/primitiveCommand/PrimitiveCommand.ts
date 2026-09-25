import { EditorAPI } from "../../EditorAPI";
import type { PropertyRoot } from "../PropertyRoot";

export enum CommandReturn {
  FINISHED = "FINISHED",
  CANCELLED = "CANCELLED",
  ERROR = "ERROR",
}

export interface PrimitiveCommandInput {
  model: PropertyRoot;
  path: string;
}

export abstract class PrimitiveCommand {
  protected api: EditorAPI;
  public hasError: boolean;
  public commited: boolean;
  protected model: PropertyRoot;
  protected path: string;
  constructor(api: EditorAPI, data: PrimitiveCommandInput) {
    this.api = api;
    this.hasError = false;
    this.commited = false;

    this.model = data.model;
    this.path = data.path;
  }

  public commit(): void {
    this.commited = true;
  }

  public abstract begin(): CommandReturn // oldValueなどの保存

  public abstract cancel(): CommandReturn // コマンドのキャンセル

  public abstract update(...args: unknown[]): CommandReturn // 値の変更

  public abstract redo(): CommandReturn // 実行

  public abstract undo(): CommandReturn // 戻す
}

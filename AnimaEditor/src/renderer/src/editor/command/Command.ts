import { EditorAPI } from "../EditorAPI";

export enum CommandReturn {
  FINISHED = "FINISHED",
  CANCELLED = "CANCELLED",
  ERROR = "ERROR",
}

export abstract class Command {
  protected api: EditorAPI;
  public hasError: boolean;
  public isFinish: boolean;
  constructor(api: EditorAPI) {
    this.api = api;
    this.hasError = false;
    this.isFinish = false;
  }

  public finish(): void {
    this.isFinish = true;
  }

  protected isStop(): boolean {
    return this.isFinish || this.hasError;
  }

  public abstract set(...args: unknown[]): CommandReturn

  public abstract update(...args: unknown[]): CommandReturn

  public abstract execute(...args: unknown[]): CommandReturn

  public abstract undo(...args: unknown[]): CommandReturn
}
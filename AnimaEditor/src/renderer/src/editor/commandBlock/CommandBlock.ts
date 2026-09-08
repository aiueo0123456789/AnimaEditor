import { CommandInputs, CommandTypes } from "../../manager/CommandManager";
import { AnimaEditor } from "../Editor";

export class CommandData {
  public command: CommandTypes;
  public setData: CommandInputs;
  constructor(command: CommandTypes, set: CommandInputs) {
    this.command = command;
    this.setData = set;
  }
}

// コマンドを組み合わせた複雑な処理をまとめるもの
export abstract class CommandBlock {
  public editor: AnimaEditor;
  public isCommandBlock: boolean;
  public commandDatas: CommandData[];
  constructor(editor: AnimaEditor) {
    this.editor = editor;
    this.isCommandBlock = true;
    this.commandDatas = [];
  }

  public abstract set(...args: unknown[]): void
}
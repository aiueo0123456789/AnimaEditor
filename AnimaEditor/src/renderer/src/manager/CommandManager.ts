
import { ClearCommand, ClearCommandInput } from "../editor/command/Clear";
import { Command, CommandReturn } from "../editor/command/Command";
import { ConcatArrayCommand, ConcatArrayCommandInput, ConcatArrayCommandUpdate } from "../editor/command/ConcatArray";
import { InsertElementCommand, InsertElementCommandInput } from "../editor/command/InsertElement";
import { PushElementCommand, PushElementCommandInput } from "../editor/command/PushElement";
import { RemoveItemCommand, RemoveItemCommandInput } from "../editor/command/RemoveItem";
import { RemoveItemsCommand, RemoveItemsCommandInput } from "../editor/command/RemoveItems";
import { SetPropertyCommand, SetPropertyCommandInput, SetPropertyCommandUpdate } from "../editor/command/SetProperty";
import { SetVec2Command } from "../editor/command/SetVec2";
import { AddObjectCommandBlock, AddObjectCommandBlockInput } from "../editor/commandBlock/AddObject";
import { CommandBlock } from "../editor/commandBlock/CommandBlock";
import { DeleteVertexCommandBlock, DeleteVertexCommandBlockInput } from "../editor/commandBlock/DeleteVertex";
import { SetActiveObjectCommandBlock, SetActiveObjectCommandBlockInput } from "../editor/commandBlock/SetActiveObject";
import { SetProjectCommandBlock, SetProjectCommandBlockInput } from "../editor/commandBlock/SetProject";
import { AnimaEditor } from "../editor/Editor";
import { Manager } from "./Manager";

export type Commands = ClearCommand | ConcatArrayCommand | InsertElementCommand | PushElementCommand | RemoveItemCommand | RemoveItemsCommand | SetPropertyCommand | SetVec2Command;
export type CommandTypes = typeof ClearCommand | typeof ConcatArrayCommand | typeof InsertElementCommand | typeof PushElementCommand | typeof RemoveItemCommand | typeof RemoveItemsCommand | typeof SetPropertyCommand | typeof SetVec2Command;
export type CommandInputs = ClearCommandInput | ConcatArrayCommandInput | InsertElementCommandInput | PushElementCommandInput | RemoveItemCommandInput | RemoveItemsCommandInput | SetPropertyCommandInput | SetVec2CommandInput;
export type CommandUpdates = ConcatArrayCommandUpdate | SetPropertyCommandUpdate;

export type CommandBlocks = AddObjectCommandBlock | SetActiveObjectCommandBlock | SetProjectCommandBlock | DeleteVertexCommandBlock;
export type CommandBlockInputs = AddObjectCommandBlockInput | SetActiveObjectCommandBlockInput | SetProjectCommandBlockInput | DeleteVertexCommandBlockInput;

export class CommandRecorder {
  public editor: AnimaEditor;
  public command: (Command) | null; // 現在処理中のコマンド
  public commands: (Command)[];
  public isFinish: boolean;
  public name: string;
  constructor(name: string, editor: AnimaEditor) {
    this.name = name;
    this.editor = editor;
    this.command = null;
    this.commands = [];
    this.isFinish = false;
  }

  setCommandBlock<T extends CommandBlock>(commandBlockClass: new (...args: any[]) => T, setData: CommandBlockInputs): void {
    if (this.isFinish) {
      console.error("このコマンドレコーダーはすでに閉じられています");
      return ;
    }
    if (this.command) {
      console.error("未終了のコマンドが存在します");
      return ;
    }
    const commandBlock = new commandBlockClass(this.editor);
    commandBlock.set(setData)
    for (const commandData of commandBlock.commandDatas) {
      const command = new commandData.command(this.editor.api);
      const result = command.set(commandData.setData);
      if (result !== CommandReturn.FINISHED) console.warn("何か問題が発生しました")
      command.finish();
      this.commands.push(command);
    }
  }

  setCommand<T extends Command>(commandClass: new (...args: any[]) => T, setData: CommandInputs): void {
    if (this.isFinish) {
      console.error("このコマンドレコーダーはすでに閉じられています");
      return ;
    }
    if (this.command) {
      console.error("未終了のコマンドが存在します");
      return ;
    }
    const c = new commandClass(this.editor.api);
    c.set(setData);
    this.command = c;
  }

  updateCommand(data: CommandUpdates): void {
    if (this.isFinish) {
      console.error("このコマンドレコーダーはすでに終了しています");
      return ;
    }
    if (!this.command) {
      console.warn("コマンドは設定されていません");
      return ;
    }
    this.command.update(data);
  }

  finishCommand(): void {
    if (this.isFinish) {
      console.error("このコマンドレコーダーはすでに終了しています");
      return ;
    }
    if (!this.command) {
      console.warn("コマンドは設定されていません");
      return ;
    }
    this.command.finish();
    this.commands.push(this.command);
    this.command = null;
  }

  finish(): boolean {
    if (this.command) {
      console.warn("処理中のコマンドがあるためレコーダーは終了できません");
      return false;
    }
    this.isFinish = true;
    return true;
  }

  private undoCommand(command: Command): CommandReturn {
    return command.undo();
  }

  undo(): boolean {
    for (const command of this.commands.reverse()) {
      const result = this.undoCommand(command);
      if (result === CommandReturn.ERROR) return false;
      else if (result === CommandReturn.CANCELLED) return false;
      // else if (result === CommandReturn.FINISHED)
    }
    return true;
  }

  private executeCommand(command: Command): CommandReturn {
    return command.execute();
  }

  execute(): boolean {
    for (const command of this.commands) {
      const result = this.executeCommand(command);
      if (result === CommandReturn.ERROR) {
        console.error("コマンド", command, "でエラーが発生しました");
        return false;
      } else if (result === CommandReturn.CANCELLED) console.warn("コマンド", command, "でキャンセルが発生しました");
      // else if (result === CommandReturn.FINISHED)
    }
    return true;
  }
}

export class CommandManager extends Manager {
  public commandRecorder: CommandRecorder | null;
  public commandRecorders: CommandRecorder[];

  private undoStack: CommandRecorder[];
  private redoStack: CommandRecorder[];

  constructor(editor: AnimaEditor) {
    super(editor);
    this.commandRecorder = null;
    this.commandRecorders = [];

    this.redoStack = [];
    this.undoStack = [];
  }

  setCommandRecorder(recorderName: string = "未設定"): CommandRecorder | null {
    console.trace();
    if (this.commandRecorder) {
      console.error("未終了のコマンドレコーダーが存在します", this.commandRecorder);
      return null;
    }
    this.commandRecorder = new CommandRecorder(recorderName, this.editor);
    console.log("レコーダーが設定されました", this.commandRecorder);
    return this.commandRecorder;
  }

  finishCommandRecorder(): void {
    if (!this.commandRecorder) {
      console.warn("コマンドレコーダーは設定されていません");
      return ;
    }
    if (!this.commandRecorder.finish()) {
      console.warn("コマンドレコーダーの終了に失敗しました");
      return ;
    }
    this.commandRecorders.push(this.commandRecorder);
    this.commandRecorder = null;
  }

  undo() {
    if (this.commandRecorders.length) {
      console.warn("未実行のコマンドがあります", [...this.commandRecorders])
    }
    if (this.undoStack.length > 0) {
      const commandRecorder = this.undoStack.pop();
      if (commandRecorder instanceof CommandRecorder) {
        commandRecorder.undo();
        this.redoStack.push(commandRecorder);
      } else {
        this.undo();
      }
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      const commandRecorder = this.redoStack.pop();
      if (commandRecorder instanceof CommandRecorder) {
        commandRecorder.execute();
        this.undoStack.push(commandRecorder);
      } else {
        // もしコマンドが壊れていたらさらに前にする
        this.redo();
      }
    }
  }

  public update(): void {
    const successCommandRecorders: CommandRecorder[] = [];
    while (this.commandRecorders.length != 0) {
      const commandRecorder = this.commandRecorders.shift();
      if (!(commandRecorder instanceof CommandRecorder)) continue ;
      const result = commandRecorder.execute();
      console.log("レコーダー", commandRecorder, "が実行されました")
      if (result) successCommandRecorders.push(commandRecorder);
    }
    if (successCommandRecorders.length) {
      for (const commandRecorder of successCommandRecorders) {
        this.undoStack.push(commandRecorder);
      }
      this.redoStack.length = 0; // 新しい操作をしたらRedoはリセット
    }
  }
}
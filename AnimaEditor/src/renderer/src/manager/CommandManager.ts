
import { InteractionCommand, InteractionCommandInput } from "../editor/command/interactionCommand/InteractionCommand";
import { PrimitiveCommand, CommandReturn, PrimitiveCommandInput } from "../editor/command/primitiveCommand/PrimitiveCommand";
import { ConcatArrayCommandUpdate } from "../editor/command/primitiveCommand/ConcatArray";
import { SetPropertyCommandUpdate } from "../editor/command/primitiveCommand/SetProperty";
import { SetVec2CommandUpdate } from "../editor/command/primitiveCommand/SetVec2";
import { AnimaEditor } from "../editor/Editor";
import { Manager } from "./Manager";
import { TranslateCommandUpdate } from "../editor/command/interactionCommand/TranslateCommand";
import type { ClearCommandUpdate } from "../editor/command/primitiveCommand/Clear";
import type { PushElementCommandUpdate } from "../editor/command/primitiveCommand/PushElement";
import type { InsertElementCommandUpdate } from "../editor/command/primitiveCommand/InsertElement";
import type { RemoveItemCommandUpdate } from "../editor/command/primitiveCommand/RemoveItem";
import type { RemoveItemsCommandUpdate } from "../editor/command/primitiveCommand/RemoveItems";
import type { SetActiveObjectCommandUpdate } from "../editor/command/interactionCommand/SetActiveObjectCommand";
import type { SetProjectCommandUpdate } from "../editor/command/interactionCommand/SetProjectCommand";
import type { BoneExtrudeCommandUpdate } from "../editor/command/interactionCommand/BoneExtrudeCommand";
import type { AddBoneWeightPaintCommandUpdate } from "../editor/command/interactionCommand/AddWeightPaintCommand";
import type { TransformCommandUpdate } from "../editor/command/interactionCommand/TransformCommand";
import type { SetPropertiesUpdate } from "../editor/command/interactionCommand/SetPropertiesCommand";
import type { AddValueCommandUpdate } from "../editor/command/primitiveCommand/AddValue";
import type { RemoveValueCommandUpdate } from "../editor/command/primitiveCommand/RemoveValue";
import type { AddDictionaryValuesCommandUpdate } from "../editor/command/interactionCommand/AddDictionaryValuesCommand";

type PrimitiveCommandInputs = PrimitiveCommandInput
type InsertElementCommandInputs = InteractionCommandInput;
export type CommandInputs = PrimitiveCommandInputs | InsertElementCommandInputs;
export type CommandUpdates = ClearCommandUpdate | PushElementCommandUpdate | InsertElementCommandUpdate |
  RemoveItemCommandUpdate | RemoveItemsCommandUpdate | ConcatArrayCommandUpdate | SetPropertyCommandUpdate |
  SetVec2CommandUpdate | TranslateCommandUpdate | SetActiveObjectCommandUpdate | SetProjectCommandUpdate |
  BoneExtrudeCommandUpdate | AddBoneWeightPaintCommandUpdate | TransformCommandUpdate | SetPropertiesUpdate |
  AddValueCommandUpdate | RemoveValueCommandUpdate | AddDictionaryValuesCommandUpdate;

function isSubclassOf(child: Function, parent: Function): boolean {
  return child.prototype instanceof parent || child === parent;
}
export class CommandRecorder {
  private editor: AnimaEditor;
  public command: (PrimitiveCommand | InteractionCommand) | null; // 現在処理中のコマンド
  public commands: (PrimitiveCommand | InteractionCommand)[];
  public isCommited: boolean;
  private applied = true;
  public name: string;
  constructor(name: string, editor: AnimaEditor) {
    this.name = name;
    this.editor = editor;
    this.command = null;
    this.commands = [];
    this.isCommited = false;
  }

  setCommand<T extends (PrimitiveCommand | InteractionCommand)>(CommandClass: new (...args: any[]) => T, data: CommandInputs): void {
    if (this.isCommited) {
      console.error("このコマンドレコーダーはすでに閉じられています");
      return ;
    }
    if (this.command) {
      console.error("未終了のコマンドが存在します", this.command);
      return ;
    }
    if (isSubclassOf(CommandClass, PrimitiveCommand)) this.command = new CommandClass(this.editor.api, data);
    else if (isSubclassOf(CommandClass, InteractionCommand)) this.command = new CommandClass(this.editor, data);
    else {
      console.warn("このクラスはコマンドを継承していません", CommandClass);
      return ;
    }
    if (this.command.begin() === CommandReturn.ERROR) {
      this.command.hasError = true;
      this.command = null;
    }
  }

  updateCommand(data: CommandUpdates): void {
    if (this.isCommited) {
      console.error("このコマンドレコーダーはすでに終了しています");
      return ;
    }
    if (!this.command) {
      console.warn("コマンドは設定されていません");
      return ;
    }
    this.command.update(data);
  }

  commitCommand(): void {
    if (this.isCommited) {
      console.error("このコマンドレコーダーはすでに終了しています");
      return ;
    }
    if (!this.command) {
      console.warn("コマンドは設定されていません");
      return ;
    }
    this.command.commit();
    this.commands.push(this.command);
    this.command = null;
  }

  cancelCommand(): void {
    if (this.isCommited) {
      console.error("このコマンドレコーダーはすでに終了しています");
      return ;
    }
    if (!this.command) {
      console.warn("コマンドは設定されていません");
      return ;
    }
    if (this.command.cancel() === CommandReturn.ERROR) return;
    this.command.commit();
    this.command = null;
  }

  commit(): boolean {
    if (this.isCommited) return false;
    if (this.command) {
      console.warn("処理中のコマンドがあるためレコーダーは終了できません");
      return false;
    }
    this.isCommited = true;
    return true;
  }

  undo(): boolean {
    if (!this.isCommited || !this.applied) return false;
    const undone: (PrimitiveCommand | InteractionCommand)[] = [];
    for (const command of [...this.commands].reverse()) {
      const result = command.undo();
      if (result === CommandReturn.ERROR) {
        for (const previous of undone.reverse()) previous.redo();
        return false;
      }
      undone.push(command);
    }
    this.applied = false;
    return true;
  }

  redo(): boolean {
    // Only replay a closed recorder that has been undone.
    if (!this.isCommited || this.applied) return false;
    const replayed: (PrimitiveCommand | InteractionCommand)[] = [];
    for (const command of this.commands) {
      const result = command.redo();
      if (result === CommandReturn.ERROR) {
        console.error("コマンド", command, "でエラーが発生しました");
        for (const previous of replayed.reverse()) previous.undo();
        return false;
      }
      replayed.push(command);
    }
    this.applied = true;
    return true;
  }

  cancel(): boolean {
    if (this.isCommited) return false;
    if (this.command) {
      const result = this.command.cancel();
      if (result === CommandReturn.ERROR) return false;
      this.command.commit();
      this.command = null;
    }
    while (this.commands.length) {
      const command = this.commands[this.commands.length - 1];
      const result = command.undo();
      if (result === CommandReturn.ERROR) return false;
      this.commands.pop();
    }
    this.isCommited = true;
    this.applied = false;
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
    if (this.commandRecorder) {
      console.error("未終了のコマンドレコーダーが存在します", this.commandRecorder);
      return null;
    }
    this.commandRecorder = new CommandRecorder(recorderName, this.editor);
    return this.commandRecorder;
  }

  cancelCommandRecorder(): void {
    if (!this.commandRecorder) {
      console.warn("コマンドレコーダーは設定されていません");
      return ;
    }
    if (!this.commandRecorder.cancel()) {
      console.warn("コマンドレコーダーの終了に失敗しました");
      return ;
    }
    this.commandRecorder = null;
  }

  commitCommandRecorder(): void {
    if (!this.commandRecorder) {
      console.warn("コマンドレコーダーは設定されていません");
      return ;
    }
    if (!this.commandRecorder.commit()) {
      console.warn("コマンドレコーダーの終了に失敗しました");
      return ;
    }
    if (this.commandRecorder.commands.length) this.commandRecorders.push(this.commandRecorder);
    this.commandRecorder = null;
  }

  undo() {
    if (this.commandRecorder) return;
    this.execute();
    const recorder = this.undoStack[this.undoStack.length - 1];
    if (recorder?.undo()) {
      this.undoStack.pop();
      this.redoStack.push(recorder);
    }
  }

  redo() {
    if (this.commandRecorder) return;
    this.execute();
    const recorder = this.redoStack[this.redoStack.length - 1];
    if (recorder?.redo()) {
      this.redoStack.pop();
      this.undoStack.push(recorder);
    }
  }

  public execute(): void {
    for (const recorder of this.commandRecorders.splice(0)) {
      if (!recorder.isCommited || !recorder.commands.length) continue;
      this.undoStack.push(recorder);
      this.redoStack.length = 0;
    }
  }

  public override update(): void {
    this.execute();
  }
}

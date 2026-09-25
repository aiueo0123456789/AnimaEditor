import { PushElementCommand, PushElementCommandInput } from "../../editor/command/primitiveCommand/PushElement";
import { AddValueCommand, AddValueCommandInput } from "../../editor/command/primitiveCommand/AddValue";
import { SetPropertyCommand, SetPropertyCommandInput } from "../../editor/command/primitiveCommand/SetProperty";
import { CommandManager } from "../CommandManager";

import type { PropertyRoot } from "../../editor/command/PropertyRoot";
export function commitUIProperty(manager: CommandManager, model: PropertyRoot, path: string, newValue: unknown): void {
  if (!model || manager.commandRecorder) return;
  const recorder = manager.setCommandRecorder("commitUIProperty: " + path);
  if (!recorder) return;
  recorder.setCommand(SetPropertyCommand, { model, path, newValue } as SetPropertyCommandInput);
  recorder.commitCommand();
  manager.commitCommandRecorder();
}

export function commitUIAddValue(manager: CommandManager, model: PropertyRoot, path: string, newKey: string, newValue: unknown): void {
  if (!model || manager.commandRecorder) return;
  const recorder = manager.setCommandRecorder("commitUIAddValue: " + path);
  if (!recorder) return;
  recorder.setCommand(AddValueCommand, { model, path, newKey, newValue } as AddValueCommandInput);
  if (!recorder.command) { manager.cancelCommandRecorder(); return; }
  recorder.commitCommand();
  manager.commitCommandRecorder();
}

export function commitUIPush(manager: CommandManager, model: PropertyRoot, path: string, newElement: unknown): void {
  if (!model || manager.commandRecorder) return;
  const recorder = manager.setCommandRecorder("commitUIPush: " + path);
  if (!recorder) return;
  recorder.setCommand(PushElementCommand, { model, path, newElement } as PushElementCommandInput);
  recorder.commitCommand();
  manager.commitCommandRecorder();
  console.log("呼ばれた")
}

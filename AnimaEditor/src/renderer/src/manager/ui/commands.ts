import { PushElementCommand, PushElementCommandInput } from "../../editor/command/primitiveCommand/PushElement";
import { AddValueCommand, AddValueCommandInput } from "../../editor/command/primitiveCommand/AddValue";
import { SetPropertyCommand, SetPropertyCommandInput } from "../../editor/command/primitiveCommand/SetProperty";
import { CommandManager } from "../CommandManager";

import type { PropertyRoot } from "../../editor/command/PropertyRoot";
import type { Models } from "../../core/project/Project";
import { SetActiveObjectCommand } from "../../editor/command/interactionCommand/SetActiveObjectCommand";
import { SetPropertiesCommand, type PropertyEdit } from "../../editor/command/interactionCommand/SetPropertiesCommand";
import { SetSelectionCommand } from "../../editor/command/interactionCommand/SetSelectionCommand";
import { Model_Animation } from "../../core/project/model/Animation";
import { Model_Texture } from "../../core/project/model/Texture";
import type { Model_Armature } from "../../core/project/model/Armature";
import type { Model_Sprite } from "../../core/project/model/Sprite";

export function commitUIActiveObject(manager: CommandManager, newActiveObject: Model_Armature | Model_Sprite | null, additive = false): void {
  if (manager.commandRecorder) return;
  const recorder = manager.setCommandRecorder("Select object");
  if (!recorder) return;
  recorder.setCommand(SetActiveObjectCommand, { newActiveObject, additive });
  if (!recorder.command) { manager.cancelCommandRecorder(); return; }
  recorder.commitCommand();
  manager.commitCommandRecorder();
}

export function commitUISelection(manager: CommandManager, model: Models, additive = false): void {
  if (manager.commandRecorder) return;
  const recorder = manager.setCommandRecorder("Select model");
  if (!recorder) return;
  recorder.setCommand(SetSelectionCommand, { domain: model instanceof Model_Animation ? "animations" : model instanceof Model_Texture ? "textures" : "objects", id: model.id, additive });
  if (!recorder.command) { manager.cancelCommandRecorder(); return; }
  recorder.commitCommand();
  manager.commitCommandRecorder();
}

export function commitUIProperties(manager: CommandManager, name: string, edits: PropertyEdit[]): void {
  if (manager.commandRecorder || !edits.length) return;
  const recorder = manager.setCommandRecorder(name);
  if (!recorder) return;
  recorder.setCommand(SetPropertiesCommand, { edits });
  if (!recorder.command) { manager.cancelCommandRecorder(); return; }
  recorder.commitCommand();
  manager.commitCommandRecorder();
}
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

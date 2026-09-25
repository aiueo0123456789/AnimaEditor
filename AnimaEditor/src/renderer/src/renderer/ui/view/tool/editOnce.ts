import type { AnimaEditor } from "../../../../editor/Editor";
import { CommandManager } from "../../../../manager/CommandManager";
import { SetPropertiesCommand, type PropertyEdit } from "../../../../editor/command/interactionCommand/SetPropertiesCommand";
export function editOnce(editor: AnimaEditor, name: string, build: () => PropertyEdit[]): void {
  const manager = editor.getManager(CommandManager);
  if (!manager || manager.commandRecorder) return;
  const edits = build();
  if (!edits.length) return;
  const recorder = manager.setCommandRecorder(name);
  if (!recorder) return;
  recorder.setCommand(SetPropertiesCommand, { edits });
  if (recorder.command) { recorder.commitCommand(); manager.commitCommandRecorder(); }
  else manager.cancelCommandRecorder();
}

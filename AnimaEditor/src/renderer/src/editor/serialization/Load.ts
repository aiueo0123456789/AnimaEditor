import { CommandManager } from "../../manager/CommandManager";
import { loadFile } from "../../util/file";
import { SetProjectCommand, SetProjectCommandInput } from "../command/interactionCommand/SetProjectCommand";
import { AnimaEditor } from "../Editor";

export async function projectLoad(editor: AnimaEditor): Promise<boolean> {
  const filePath = await window.fileAPI.showOpenDialog();
  if (!filePath) return false;
  const loadData: any = await loadFile(filePath);
  console.log(loadData)
  const commandManager = editor.getManager(CommandManager) as CommandManager;
  const recorder = commandManager.setCommandRecorder();
  if (!recorder) return false;
  recorder.setCommand(SetProjectCommand, {newProjectData: loadData} as SetProjectCommandInput);
  recorder.commitCommand();
  commandManager.commitCommandRecorder();
  return true;
}

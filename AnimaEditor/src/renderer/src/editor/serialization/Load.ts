import { CommandManager } from "../../manager/CommandManager";
import { loadFile } from "../../util/file";
import { AddObjectCommandBlock, AddObjectCommandBlockInput } from "../commandBlock/AddObject";
import { SetProjectCommandBlock, SetProjectCommandBlockInput } from "../commandBlock/SetProject";
import { AnimaEditor } from "../Editor";

export async function projectLoad(editor: AnimaEditor): Promise<boolean> {
  const filePath = await window.fileAPI.showOpenDialog();
  if (!filePath) return false;
  const loadData: any = await loadFile(filePath);
  console.log(loadData)
  const commandManager = editor.getManager(CommandManager) as CommandManager;
  const recorder = commandManager.setCommandRecorder();
  if (!recorder) return false;
  recorder.setCommandBlock(SetProjectCommandBlock, {
    projectData: loadData
  } as SetProjectCommandBlockInput);
  // for (const modelData of loadData.models) {
  //   recorder.setCommandBlock(AddObjectCommandBlock, {
  //     modelData: modelData
  //   } as AddObjectCommandBlockInput);
  // }
  commandManager.finishCommandRecorder();
  return true;
}

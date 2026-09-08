import { AnimaEditor } from "../Editor";

export async function projectSave(editor: AnimaEditor): Promise<boolean> {
  const filePath = await window.fileAPI.showSaveDialog("セーブデータ");
  if (!filePath) return false;
  const jsonText = JSON.stringify(editor.project);
  const success = await window.fileAPI.writeFile(filePath, jsonText);
  if (!success) {
    console.error('保存に失敗しました:', filePath);
  }
  return success;
}

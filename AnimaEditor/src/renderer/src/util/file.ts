export async function loadFile(path: string): Promise<unknown | string | null> {
  try {
    const text = await window.fileAPI.readFile(path);
    if (text === null) {
      console.trace("ファイルが見つかりません:", path);
      return null;
    }

    const isJSON = path.toLowerCase().endsWith(".json");
    if (!isJSON) return text;

    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn("JSON化できませんでした:", e);
    }
  } catch (e) {
    console.trace("エラー:", e);
    return null;
  }
  return null;
}

export async function saveFile(path: string, data: any): Promise<boolean> {
  const isJSON = typeof data !== "string";
  const text = isJSON ? JSON.stringify(data, null, 2) : data;
  const success = await window.fileAPI.writeFile(path, text);
  if (!success) {
    console.error("ファイルの保存に失敗しました:", path);
  }
  return success;
}

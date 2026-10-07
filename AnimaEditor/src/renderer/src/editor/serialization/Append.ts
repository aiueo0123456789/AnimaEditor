import { ModelNames, type ProjectInput } from "../../core/project/Project";
import { CommandManager } from "../../manager/CommandManager";
import { loadFile } from "../../util/file";
import { AppendModelsCommand, type AppendModelInput } from "../command/interactionCommand/AppendModelsCommand";
import type { AnimaEditor } from "../Editor";

export interface AppendSource {
  projectName: string;
  models: AppendModelInput[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isAppendModel(value: unknown): value is AppendModelInput {
  if (!isRecord(value)) return false;
  return value.modelName === ModelNames.Sprite || value.modelName === ModelNames.Aramature ||
    value.modelName === ModelNames.Animation || value.modelName === ModelNames.Texture;
}

export function parseAppendSource(value: unknown): AppendSource | null {
  if (!isRecord(value) || !Array.isArray(value.models) || !value.models.every(isAppendModel)) return null;
  const scene = isRecord(value.sceneConfig) ? value.sceneConfig : null;
  return {
    projectName: typeof scene?.projectName === "string" ? scene.projectName : "名称未設定",
    models: value.models as ProjectInput["models"] as AppendModelInput[],
  };
}

export async function selectAppendSource(): Promise<AppendSource | null> {
  const filePath = await window.fileAPI.showOpenDialog();
  if (!filePath) return null;
  const source = parseAppendSource(await loadFile(filePath));
  if (!source) throw new Error("選択したJSONはAnimaEditorのセーブデータではありません");
  return source;
}

export function appendProjectModels(editor: AnimaEditor, models: AppendModelInput[]): boolean {
  if (!models.length) return false;
  const commands = editor.getManager(CommandManager);
  const recorder = commands?.setCommandRecorder("Append models");
  if (!commands || !recorder) return false;
  recorder.setCommand(AppendModelsCommand, { models });
  if (!recorder.command) {
    commands.cancelCommandRecorder();
    return false;
  }
  recorder.commitCommand();
  commands.commitCommandRecorder();
  return true;
}

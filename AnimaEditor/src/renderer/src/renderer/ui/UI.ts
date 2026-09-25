import { Models } from "../../core/project/Project";
import type { AnimaEditor } from "../../editor/Editor";
import { SetPropertyCommand, SetPropertyCommandInput } from "../../editor/command/primitiveCommand/SetProperty";
import { SetActiveObjectCommand } from "../../editor/command/interactionCommand/SetActiveObjectCommand";
import { JTag_CustomTag } from "../../library/JTag/tag/CustomTag";
import { JTag_DBInput } from "../../library/JTag/tag/DBInput";
import { CommandManager } from "../../manager/CommandManager";
import { SourceContext } from "../../manager/context/contexts/SourceContext";
import { Tool } from "./view/tool/Tool";

export class ToolRender {
  public id: string;
  public icon: string;
  public callTool: any;
  constructor(id: string, icon: string, callTool: any) {
    this.id = id;
    this.icon = icon;
    this.callTool = callTool;
  }
}

export class ToolManager {
  public activeTool: Tool | null;
  constructor() {
    this.activeTool = null;
  }

  /**
   * ツールの起動
   */
  activate<T extends Tool>(ToolClass: new () => T): void {
    this.activeTool?.deactivate();
    this.activeTool = new ToolClass();
    this.activeTool.activate();
  }
}

export abstract class UIComponent {
  public dispose?(_editor: AnimaEditor): void;
  public id: number;
  public name: string;
  public icon: string;
  constructor(data: {id: number, name: string, icon: string}) {
    this.id = data.id;
    this.name = data.name;
    this.icon = data.icon;
  }

  public abstract input(...args: unknown[]): void

  public abstract update(...args: unknown[]): void
}

function stopPropagation(e): void {
  e.stopPropagation();
};
export function setStopPropagation(tag: HTMLElement, event: string) {
  tag.addEventListener(event, stopPropagation);
}

export function setActiveObjectOnClick(commandManager: CommandManager, clickTarget: JTag_CustomTag, newActiveObject: Models) {
  const onClick = () => {
    const recorder = commandManager.setCommandRecorder();
    if (!recorder) return;
    recorder.setCommand(SetActiveObjectCommand, { newActiveObject });
    recorder.commitCommand();
    commandManager.commitCommandRecorder();
  };
  clickTarget.addEventListener("click", onClick);
}

export function setPropertyOnInput(commandManager: CommandManager, inputTarget: JTag_DBInput, object: unknown, path: string) {
  const onChange = () => {
    const recorder = commandManager.setCommandRecorder();
    if (!recorder) return;
    recorder?.setCommand(SetPropertyCommand, {
      model: object instanceof SourceContext ? object.resolve() : object,
      path: path,
      newValue: inputTarget.value
    } as SetPropertyCommandInput);
    recorder?.commitCommand();
    commandManager.commitCommandRecorder();
  };
  inputTarget.addEventListener("change", onChange);
}

import { Models } from "../../core/project/Project";
import type { AnimaEditor } from "../../editor/Editor";
import { SetPropertyCommand, SetPropertyCommandInput } from "../../editor/command/primitiveCommand/SetProperty";
import { commitUISelection } from "../../manager/ui/commands";
import { JTag_CustomTag } from "../../library/JTag/tag/CustomTag";
import { JTag_DBInput } from "../../library/JTag/tag/DBInput";
import { CommandManager } from "../../manager/CommandManager";
import { SourceContext } from "../../manager/context/contexts/SourceContext";
import { ContextMenuManager } from "../../manager/ui/ContextMenuManager";

export abstract class SpaceData {
  constructor() {}
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

  public _input(editor: AnimaEditor): void {
    if (ContextMenuManager.isOpen) return ;
    this.input(editor);
  }

  public abstract input(editor: AnimaEditor): void

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
    commitUISelection(commandManager, newActiveObject);
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

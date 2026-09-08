import { Models } from "../../core/project/Project";
import { SetPropertyCommand, SetPropertyCommandInput } from "../../editor/command/SetProperty";
import { SetActiveObjectCommandBlock, SetActiveObjectCommandBlockInput } from "../../editor/commandBlock/SetActiveObject";
import { JTag_CustomTag } from "../../library/JTag/tag/CustomTag";
import { JTag_DBInput } from "../../library/JTag/tag/DBInput";
import { JTag_Select } from "../../library/JTag/tag/Select";
import { CommandManager, CommandRecorder } from "../../manager/CommandManager";
import { SourceContext } from "../../manager/context/SourceContext";
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
    this.activeTool = new ToolClass();
    this.activeTool.activate();
  }
}

export abstract class UIComponent {
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

// // DBInputにイベントを設定
// export function setEventDBInput(commandManager: CommandManager, dbInput: JTag_DBInput, object: any, property: string, valueToObjectFn?: Function): Function {
//   dbInput.setValue(object[property]);

//   const fn = (e) => {
//     const renameCommand = commandManager.createCommand(SetPropertyCommand);
//     renameCommand.set(object, property, e.target.value);

//     const inputFn = (e) => {
//       renameCommand.update(e.target.value);
//     };
//     dbInput.input.addEventListener("input", inputFn);

//     const changeFn = () => {
//       const recorder = commandManager.createCommandRecorder();
//       recorder.appendCommand(renameCommand);
//       commandManager.appendCommandRecorder(recorder);
//       dbInput.input.removeEventListener("input", inputFn);
//       dbInput.input.removeEventListener("change", changeFn);
//     };
//     dbInput.input.addEventListener("change", changeFn);
//   };
//   const removeData = dbInput.addEventListener("focus", fn);
//   return () => dbInput.removeEventListener(removeData);
// }

// // クリックイベントを設定
// export function setEventClick(commandManager: CommandManager, target: CustomTag, object: any, property: string, value?: unknown | Function): Function {
//   const changeFn = (e) => {
//     const renameCommand = commandManager.createCommand(SetPropertyCommand);
//     if (value instanceof Function) renameCommand.set(object, property, value());
//     else renameCommand.set(object, property, value);
//     const recorder = commandManager.createCommandRecorder();
//     recorder.appendCommand(renameCommand);
//     commandManager.appendCommandRecorder(recorder);
//   };
//   const removeData = target.addEventListener("click", changeFn);
//   return () => target.removeEventListener(removeData);
// }

// // クリックイベントを設定
// export function setEventClickForFunction(target: CustomTag, value: EventListenerOrEventListenerObject): Function {
//   const removeData = target.addEventListener("click", value);
//   return () => target.removeEventListener(removeData);
// }

// // DBInputにイベントを設定
// export function setEventSelect(commandManager: CommandManager, select:JTag_Select, object: any, property: string, valueToObjectFn?: Function): Function {
//   select.setValue(object[property]);

//   const changeFn = (e) => {
//     const renameCommand = commandManager.createCommand(SetPropertyCommand);
//     renameCommand.set(object, property, valueToObjectFn instanceof Function ? valueToObjectFn(e.target.value) : e.target.value);
//     const recorder = commandManager.createCommandRecorder();
//     recorder.appendCommand(renameCommand);
//     commandManager.appendCommandRecorder(recorder);
//   };
//   const removeData = select.addEventListener("change", changeFn);
//   return () => select.removeEventListener(removeData);
// }

function stopPropagation(e): void {
  e.stopPropagation();
};
export function setStopPropagation(tag: HTMLElement, event: string) {
  tag.addEventListener(event, stopPropagation);
}

// export function setPropertyOnClick(commandManager: CommandManager, clickTarget: JTag_DBInput, object: unknown, path: string, newValue: unknown) {
//   const onClick = (e) => {
//     const recorder = commandManager.setCommandRecorder();
//     recorder?.setCommand(SetPropertyCommand, {
//       model: object instanceof SourceContext ? object.resolve() : object,
//       path: path,
//       newValue: newValue
//     } as SetPropertyCommandInput);
//     recorder?.finishCommand();
//     commandManager.finishCommandRecorder();
//   };
//   clickTarget.addEventListener("click", onClick);
// }

// export function setActionOnClick(commandManager: CommandManager, clickTarget: JTag_CustomTag, action: Function) {
//   const onClick = (e) => {
//     const recorder = commandManager.setCommandRecorder();
//     recorder?.setCommandBlock(SetActiveObjectCommandBlock, {
//       model: newActiveObject,
//     } as SetActiveObjectCommandBlockInput);
//     commandManager.finishCommandRecorder();
//   };
//   clickTarget.addEventListener("click", onClick);
// }

export function setActiveObjectOnClick(commandManager: CommandManager, clickTarget: JTag_CustomTag, newActiveObject: Models) {
  const onClick = (e) => {
    const recorder = commandManager.setCommandRecorder();
    recorder?.setCommandBlock(SetActiveObjectCommandBlock, {
      model: newActiveObject,
    } as SetActiveObjectCommandBlockInput);
    commandManager.finishCommandRecorder();
  };
  clickTarget.addEventListener("click", onClick);
}

export function setPropertyOnInput(commandManager: CommandManager, inputTarget: JTag_DBInput, object: unknown, path: string) {
  const onChange = (e) => {
    const recorder = commandManager.setCommandRecorder();
    recorder?.setCommand(SetPropertyCommand, {
      model: object instanceof SourceContext ? object.resolve() : object,
      path: path,
      newValue: inputTarget.value
    } as SetPropertyCommandInput);
    recorder?.finishCommand();
    commandManager.finishCommandRecorder();
  };
  inputTarget.addEventListener("change", onChange);
}
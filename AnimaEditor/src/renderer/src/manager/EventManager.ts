import { Models } from "../core/project/Project";
import { AnimaEditor } from "../editor/Editor";
import { SourceContext } from "./context/SourceContext";
import { Manager } from "./Manager";

export enum EditorEventType {
  change = "change",
  add = "add",
  delete = "delete",
}

export type EditorEventSourceObject = SourceContext | Models | unknown;

export class EditorEvent {
  public type: EditorEventType;
  public source: EditorEventSourceObject;
  public path: string;
  constructor(type: EditorEventType, source: EditorEventSourceObject, path: string) {
    this.type = type;
    this.source = source;
    this.path = path;
  }
}

export class EventManager extends Manager {
  public events: EditorEvent[];
  constructor(editor: AnimaEditor) {
    super(editor);
    this.events = [];
  }

  emit(type: EditorEventType, source: EditorEventSourceObject, path: string) {
    const event = new EditorEvent(type, source, path);
    this.events.push(event);
  }

  update() {
    this.events.length = 0;
  }
}
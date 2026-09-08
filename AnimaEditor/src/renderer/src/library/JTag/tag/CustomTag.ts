import { JTag } from "../JTag";

export class EventListenerData {
  public event: string;
  public listener: EventListenerOrEventListenerObject;
  public target: JTag_CustomTag;
  constructor(event: string, listener: EventListenerOrEventListenerObject, target: JTag_CustomTag) {
    this.event = event;
    this.listener = listener;
    this.target = target;
  }
}

export class JTag_CustomTag {
  public id: string;
  private jTga: JTag;
  public parent: JTag_CustomTag | null;
  public body: HTMLElement;
  public childrenContainer: HTMLElement[];
  public childrenPerContainer: JTag_CustomTag[][];
  public customData: Record<string, unknown>;
  public eventMap: Record<string, HTMLElement>;

  constructor(jTga: JTag, body: HTMLElement, childrenContainer: HTMLElement[]) {
    this.id = "";

    this.jTga = jTga;
    this.parent = null;
    this.body = body;
    this.childrenContainer = childrenContainer;
    this.childrenPerContainer = childrenContainer.map(x => []);
    this.eventMap = {};

    this.customData = {};
  }

  get children(): JTag_CustomTag[] {
    return this.childrenPerContainer.flat();
  }

  public getElementByID(id: string): JTag_CustomTag | null {
    for (const chil of this.children) {
      if (chil.id === id) {
        return chil;
      }
    }
    return null;
  }

  public addEventListener(event: string, listener: EventListenerOrEventListenerObject): EventListenerData {
    const target = this.eventMap[event] ?? this.body;
    target.addEventListener(event, listener);
    return new EventListenerData(event, listener, this);
  }

  public removeEventListener(event: string, listener: EventListenerOrEventListenerObject): void {
    const target = this.eventMap[event] ?? this.body;
    target.removeEventListener(event, listener);
  }
}

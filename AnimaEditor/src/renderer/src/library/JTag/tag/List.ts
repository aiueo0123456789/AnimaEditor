import { JTag } from "../JTag";
import { JTag_CustomTag } from "./CustomTag";

export class JTag_List extends JTag_CustomTag {
  public list: HTMLDivElement;
  public actionsDiv: HTMLDivElement;
  constructor(jTag: JTag) {
    const body = document.createElement("div");
    const list = document.createElement("div");
    const actions = document.createElement("div");
    super(jTag, body, [list, actions]);
    body.append(list, actions);
    body.classList.add("JTag_List");
    list.classList.add("list");
    actions.classList.add("actions");

    this.list = list;
    this.actionsDiv = actions;
  }

  public setActions(actions: {name: string, icon: string}[]): void {
    this.actionsDiv.replaceChildren();
    for (const action of actions) {
      const actionBtn = document.createElement("button");
      const icon = document.createElement("span");
      icon.innerHTML = action.icon;
      // actionBtn.textContent = action.name;
      actionBtn.append(icon);
      this.actionsDiv.append(actionBtn);
    }
  }

  public setMinHeight(minHeight: number): void {
    this.list.style.minHeight = `${minHeight}px`;
  }

  public setMaxHeight(maxHeight: number): void {
    this.list.style.maxHeight = `${maxHeight}px`;
  }
}

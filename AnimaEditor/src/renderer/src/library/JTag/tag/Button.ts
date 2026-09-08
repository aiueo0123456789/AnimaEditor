import { JTag } from "../JTag";
import { JTag_CustomTag } from "./CustomTag";

export class JTag_Button extends JTag_CustomTag {
  public icon: HTMLSpanElement;
  public text: HTMLSpanElement;
  constructor(jTag: JTag) {
    const body = document.createElement("div");
    const icon = document.createElement("span");
    const text = document.createElement("span");
    body.append(icon, text);
    super(jTag, body, []);
    this.icon = icon;
    this.text = text;
    body.classList.add("JTag_Button");
    icon.classList.add("icon");
    text.classList.add("text");
  }

  public setText(text: string): void {
    this.text.textContent = text;
  }

  public setIcon(svg: string): void {
    this.icon.innerHTML = svg;
  }
}

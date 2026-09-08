import { JTag } from "../JTag";
import { JTag_CustomTag } from "./CustomTag";


export class JTag_Label extends JTag_CustomTag {
  constructor(jTag: JTag) {
    const body = document.createElement("label");
    super(jTag, body, []);
    body.classList.add("JTag_Label");
  }

  public setLabel(text: string): void {
    this.body.textContent = text;
  }
}

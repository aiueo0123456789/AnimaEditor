import { JTag } from "../JTag";
import { JTag_CustomTag } from "./CustomTag";

export class JTag_Text extends JTag_CustomTag {
  constructor(jTag: JTag) {
    const body = document.createElement("div");
    super(jTag, body, []);
    body.classList.add("JTag_Text");
  }

  setText(text: string) {
    this.body.textContent = text;
  }
}

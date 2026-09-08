import { JTag } from "../JTag";
import { JTag_CustomTag } from "./CustomTag";


export class JTag_LayersTree extends JTag_CustomTag {
  constructor(jTag: JTag) {
    const body = document.createElement("div");
    const childrenContainer = document.createElement("div");
    super(jTag, body, [childrenContainer]);
    body.appendChild(childrenContainer);
    body.classList.add("JTag_LayersTree");
    childrenContainer.classList.add("children");
  }
}

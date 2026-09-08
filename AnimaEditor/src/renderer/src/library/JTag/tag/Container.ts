import { JTag } from "../JTag";
import { JTag_CustomTag } from "./CustomTag";


export class JTag_Container extends JTag_CustomTag {
  constructor(jTag: JTag) {
    const body = document.createElement("div");
    super(jTag, body, [body]);
    body.classList.add("JTag_Container");
  }
}

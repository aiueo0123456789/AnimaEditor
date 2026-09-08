import { JTag } from "../JTag";
import { JTag_CustomTag } from "./CustomTag";


export class JTag_Canvas extends JTag_CustomTag {
  public override body: HTMLCanvasElement;
  constructor(jTag: JTag) {
    const body = document.createElement("canvas");
    super(jTag, body, []);
    this.body = body;
    body.classList.add("JTag_Canvas");
  }
}

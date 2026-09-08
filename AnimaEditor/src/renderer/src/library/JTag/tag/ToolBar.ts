import { JTag } from "../JTag";
import { JTag_CustomTag } from "./CustomTag";


export class JTag_ToolBar extends JTag_CustomTag {
  constructor(jTag: JTag) {
    const body = document.createElement("div");
    const childrenContainer = document.createElement("div");
    super(jTag, body, [childrenContainer]);
    const resizer = document.createElement("div");
    body.append(childrenContainer, resizer);
    resizer.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      const startHeight = body.offsetHeight;
      const startY = e.clientY;
      const onMouseMove = (e_) => {
        const newHeight = startHeight + (e_.clientY - startY);
        body.style.height = `${newHeight}px`;
      };
      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
    body.classList.add("JTag_ToolBar");
    childrenContainer.classList.add("children");
    resizer.classList.add("resizer");
  }
}

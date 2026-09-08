import { JTag } from "../JTag";
import { JTag_CustomTag } from "./CustomTag";

;

export class JTag_Column extends JTag_CustomTag {
  constructor(jTag: JTag) {
    const body = document.createElement("div");
    const childrenContainer0 = document.createElement("div");
    const childrenContainer1 = document.createElement("div");
    const resizer = document.createElement("div");
    resizer.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      const startWidth = childrenContainer0.offsetWidth;
      const startX = e.clientX;
      const onMouseMove = (e_) => {
        const newWidth = startWidth + (e_.clientX - startX);
        body.style.gridTemplateColumns = `${newWidth}px 5px 1fr`;
      };
      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
    body.append(childrenContainer0, resizer, childrenContainer1);
    super(jTag, body, [childrenContainer0, childrenContainer1]);
    body.classList.add("JTag_Column");
    resizer.classList.add("resizer");
  }
}

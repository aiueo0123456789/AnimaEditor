import { JTag } from "../JTag";
import { JTag_CustomTag } from "./CustomTag";

export class JTag_HierarchyNode extends JTag_CustomTag {
  public list: HTMLDivElement;
  public row: HTMLDivElement;
  private toggle: HTMLDivElement;

  constructor(jTag: JTag) {
    const body = document.createElement("div");
    const row = document.createElement("div");
    const childrenContainer = document.createElement("div");
    super(jTag, body, [row, childrenContainer]);
    body.classList.add("JTag_HierarchyNode");
    body.dataset.open = "true";
    row.classList.add("row");
    childrenContainer.classList.add("children");
    const toggle = document.createElement("div");
    toggle.classList.add("toggle");
    toggle.innerHTML = JTag.getSvg("rightTriangle");

    toggle.addEventListener("click", () => {
      if (body.dataset.open === "true") body.dataset.open = "false";
      else body.dataset.open = "true";
    });
    body.append(row, childrenContainer);
    row.append(toggle);

    this.row = row;
    this.list = childrenContainer;
    this.toggle = toggle;
  }

  hiddeToggle() {
    this.toggle.classList.add("empty");
  }
  vissibleToggle() {
    this.toggle.classList.remove("empty");
  }
}

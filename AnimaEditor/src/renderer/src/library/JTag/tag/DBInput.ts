import { JTag } from "../JTag";
import { JTag_CustomTag } from "./CustomTag";


export class JTag_DBInput extends JTag_CustomTag {
  public input: HTMLInputElement;
  constructor(jTag: JTag) {
    const body = document.createElement("div");
    const input = document.createElement("input");
    body.append(input);
    super(jTag, body, []);
    this.input = input;
    body.classList.add("JTag_Input");
    input.classList.add("input");

    this.input.setAttribute("readonly", "true");
    this.input.addEventListener("dblclick", () => {
      this.input.removeAttribute("readonly");
      this.input.focus();
    });

    this.input.addEventListener("blur", () => {
      this.input.setAttribute("readonly", "true");
    });

    this.eventMap["focus"] = input;
    this.eventMap["blur"] = input;
    this.eventMap["input"] = input;
    this.eventMap["change"] = input;
  }

  get value() {
    return this.input.value;
  }

  public setValue(value: string): void {
    this.input.value = value;
  }
}

import { JTag } from "../JTag";
import { JTag_CustomTag } from "./CustomTag";


export class JTag_SearchBar extends JTag_CustomTag {
  public input: HTMLInputElement;
  constructor(jTag: JTag) {
    const body = document.createElement("div");
    const input = document.createElement("input");
    body.append(input);
    super(jTag, body, []);
    this.input = input;
    body.classList.add("JTag_Input");
    input.classList.add("input");
  }

  public setValue(value: string): void {
    this.input.value = value;
  }
}

import { JTag } from "../JTag";
import { JTag_CustomTag } from "./CustomTag";

class Option {
  public id: string;
  public text: string;
  constructor(id: string, text: string) {
    this.id = id;
    this.text = text;
  }
}

export class JTag_Select extends JTag_CustomTag {
  public static createOption(id: string, text: string): Option {
    return new Option(id, text);
  }

  public input: HTMLInputElement;
  private valueView: HTMLDivElement;
  private optionsContainer: HTMLDivElement;
  private options: Option[];
  private optionGenerator: Function | null;

  constructor(jTag: JTag) {
    const body = document.createElement("div");
    const input = document.createElement("input");
    const valueView = document.createElement("div");
    const optionsContainer = document.createElement("div");
    body.append(input, valueView);
    document.body.append(optionsContainer);
    super(jTag, body, []);
    this.input = input;
    this.valueView = valueView;
    this.optionsContainer = optionsContainer;
    body.classList.add("JTag_Select");
    input.classList.add("input");
    valueView.classList.add("valueView");
    optionsContainer.classList.add("JTag_Select-options");
    optionsContainer.classList.add("hidden");

    valueView.textContent = "未選択";
    input.value = "";

    this.options = [];

    this.optionGenerator = null;

    body.addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.optionGenerator) this.setOptions(this.optionGenerator());
      const bbox = body.getBoundingClientRect();
      optionsContainer.style.top = `${bbox.bottom}px`;
      optionsContainer.style.left = `${bbox.left}px`;
      optionsContainer.style.width = `${bbox.width}px`;
      optionsContainer.classList.remove("hidden");

      const closeFn = (e) => {
        optionsContainer.classList.add("hidden");
        document.removeEventListener("click", closeFn);
      };2
      document.addEventListener("click", closeFn);
    });

    this.eventMap["input"] = input;
    this.eventMap["change"] = input;
  }

  public setOptionGenerator(OptionGenerator: Function): void {
    this.optionGenerator = OptionGenerator;
    this.setOptions(this.optionGenerator());
  }

  public setOptions(options: Option[]): void {
    this.optionsContainer.replaceChildren();
    this.options.length = 0;
    for (const option of options) {
      const optionTag = document.createElement("div");
      optionTag.textContent = option.text;
      this.optionsContainer.appendChild(optionTag);
      optionTag.addEventListener("click", () => {
        this.input.value = option.id;
        this.valueView.textContent = option.text;
        this.input.dispatchEvent(new Event("input", { bubbles: true }));
        this.input.dispatchEvent(new Event("change", { bubbles: true }));
      });
      this.options.push(option);
    }
  }

  public setValue(valueID: string, dispatch: boolean = true): void {
    for (const option of this.options) {
      if (option.id === valueID) {
        this.input.value = option.id;
        this.valueView.textContent = option.text;
        if (dispatch) {
          this.input.dispatchEvent(new Event("input", { bubbles: true }));
          this.input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    }
  }
}

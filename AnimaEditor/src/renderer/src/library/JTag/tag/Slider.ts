import { JTag } from "../JTag";
import { JTag_CustomTag } from "./CustomTag";

export class JTag_Slider extends JTag_CustomTag {
  private value: number;
  private min: number;
  private max: number;
  public input: HTMLInputElement;
  private presentation: HTMLSpanElement;

  constructor(jTag: JTag) {
    const body = document.createElement("div");
    const slider = document.createElement("div");
    const track = document.createElement("div");
    const input = document.createElement("input");
    const stick = document.createElement("span");
    const presentation = document.createElement("span");
    track.append(stick, presentation);
    slider.append(track, input);
    body.append(slider);
    super(jTag, body, []);
    body.classList.add("JTag_Slider");
    stick.classList.add("stick");
    slider.classList.add("slider");
    presentation.classList.add("presentation");
    track.classList.add("track");

    this.value = 0;
    this.min = 0;
    this.max = 100;

    this.input = input;
    this.presentation = presentation;

    presentation.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      const startValue = this.value;
      const startX = e.clientX;
      const maxWidth = stick.offsetWidth;
      const onMouseMove = (e_) => {
        this.value = startValue + ((e_.clientX - startX) / maxWidth) * this.max;
        this.value = Math.max(this.min, Math.min(this.value, this.max));
        this._styleUpdate();
      };
      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
    input.addEventListener("input", () => {});
    input.addEventListener("change", () => {
      this.value = Number(input.value);
      this._styleUpdate();
    });

    this.eventMap["input"] = input;
    this.eventMap["change"] = input;
  }

  private _styleUpdate(): void {
    this.input.value = `${this.value}`;
    this.presentation.style.left = `${((this.value - this.min) / (this.max - this.min)) * 100}%`;
  }

  public setMax(max: number): void {
    this.max = max;
    this._styleUpdate();
  }

  public setMin(min: number): void {
    this.min = min;
    this._styleUpdate();
  }

  public setValue(value: number): void {
    this.value = value;
    this._styleUpdate();
  }
}

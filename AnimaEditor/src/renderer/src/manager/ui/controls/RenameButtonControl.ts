import type { RenameButtonProps } from "../components/RenameButton";

export function createRenameButtonControl(props: RenameButtonProps) {
  const controller = new AbortController();
  const signal = controller.signal;
  const element = document.createElement("div");
  element.className = "ui-rename-button";
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.widget = "button";
  button.title = "Double-click or F2 to rename";
  const input = document.createElement("input");
  input.type = "text";
  input.hidden = true;
  element.append(button, input);
  let label = "";
  let initial = "";
  let editing = false;
  let composing = false;
  let disposed = false;

  function finish(commit: boolean, restoreFocus = false): void {
    if (!editing) return;
    const value = input.value.trim();
    editing = false;
    composing = false;
    input.hidden = true;
    button.hidden = false;
    if (restoreFocus) button.focus({ preventScroll: true });
    if (commit && value && value !== initial) props.onRename(value);
  }
  function begin(): void {
    if (disposed || editing || button.disabled) return;
    initial = label;
    input.value = label;
    editing = true;
    button.hidden = true;
    input.hidden = false;
    input.focus({ preventScroll: true });
    input.select();
  }
  button.addEventListener("click", () => { if (!button.disabled) props.onPress(); }, { signal });
  button.addEventListener("dblclick", event => { event.preventDefault(); event.stopPropagation(); begin(); }, { signal });
  button.addEventListener("keydown", event => {
    if (event.key === "F2") { event.preventDefault(); event.stopPropagation(); begin(); }
  }, { signal });
  input.addEventListener("compositionstart", () => { composing = true; }, { signal });
  input.addEventListener("compositionend", () => { composing = false; }, { signal });
  input.addEventListener("keydown", event => {
    event.stopPropagation();
    if (composing || event.isComposing || event.keyCode === 229) return;
    if (event.key === "Enter" || event.key === "Escape") {
      event.preventDefault();
      finish(event.key === "Enter", true);
    }
  }, { signal });
  input.addEventListener("blur", () => finish(true), { signal });
  return {
    element,
    setLabel(value: string): void {
      label = value;
      button.textContent = value;
      button.setAttribute("aria-label", value);
      input.setAttribute("aria-label", `${value}: 名前`);
    },
    setPressed(value: boolean): void { button.setAttribute("aria-pressed", String(value)); },
    setDisabled(value: boolean): void {
      if (value) finish(false);
      button.disabled = input.disabled = value;
    },
    dispose(): void {
      disposed = true;
      controller.abort();
      finish(false);
      element.remove();
    },
  };
}

import type { SelectProps } from "../components/Select";

let nextId = 0;

export function createSelectControl(props: SelectProps) {
  const controller = new AbortController();
  const signal = controller.signal;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ui-select-trigger";
  button.setAttribute("role", "combobox");
  button.setAttribute("aria-label", props.label);
  button.setAttribute("aria-haspopup", "listbox");
  button.setAttribute("aria-expanded", "false");
  const caption = document.createElement("span");
  const arrow = document.createElement("span");
  arrow.className = "ui-chevron";
  arrow.setAttribute("aria-hidden", "true");
  button.append(caption, arrow);
  const popup = document.createElement("div");
  popup.className = "ui-select-popup";
  popup.id = `ui-select-${nextId++}`;
  popup.setAttribute("role", "listbox");
  popup.setAttribute("aria-label", props.label);
  button.setAttribute("aria-controls", popup.id);
  let opened = false;
  let current: string | null = null;
  let active = -1;
  let typed = "";
  let lastType = 0;
  const options = props.options.map((option, index) => {
    const node = document.createElement("div");
    node.id = `${popup.id}-${index}`;
    node.className = "ui-select-option";
    node.setAttribute("role", "option");
    node.setAttribute("aria-disabled", String(option.disabled ?? false));
    node.textContent = option.label;
    node.title = option.label;
    node.addEventListener("pointermove", () => { if (!option.disabled) highlight(index); }, { signal });
    node.addEventListener("click", () => choose(index), { signal });
    popup.append(node);
    return node;
  });
  if (!options.length) {
    const empty = document.createElement("div");
    empty.className = "ui-select-empty";
    empty.textContent = "候補なし";
    popup.append(empty);
  }
  const enabled = props.options.map((_, index) => index).filter(index => !props.options[index].disabled);

  function highlight(index: number): void {
    active = index;
    options.forEach((node, i) => node.classList.toggle("is-active", i === index));
    if (opened && options[index]) {
      button.setAttribute("aria-activedescendant", options[index].id);
      options[index].scrollIntoView({ block: "nearest" });
    } else button.removeAttribute("aria-activedescendant");
  }
  function position(): void {
    if (!opened) return;
    const rect = button.getBoundingClientRect();
    const margin = 6;
    const width = Math.min(Math.max(rect.width, 160), window.innerWidth - margin * 2);
    const below = window.innerHeight - rect.bottom - margin;
    const above = rect.top - margin;
    const upwards = below < 180 && above > below;
    popup.style.width = `${width}px`;
    popup.style.maxHeight = `${Math.max(0, Math.min(280, upwards ? above : below))}px`;
    popup.style.left = `${Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin))}px`;
    popup.style.top = `${upwards ? Math.max(margin, rect.top - popup.offsetHeight - 4) : rect.bottom + 4}px`;
  }
  function close(): void {
    opened = false;
    popup.remove();
    button.setAttribute("aria-expanded", "false");
    button.removeAttribute("aria-activedescendant");
    typed = "";
  }
  function open(): void {
    if (button.disabled || opened) return;
    opened = true;
    document.body.append(popup);
    button.setAttribute("aria-expanded", "true");
    position();
    const selected = props.options.findIndex(option => option.value === current && !option.disabled);
    highlight(selected >= 0 ? selected : enabled[0] ?? -1);
  }
  function setValue(value: string | null): void {
    current = value;
    const option = props.options.find(item => item.value === value);
    caption.textContent = option?.label ?? props.placeholder ?? "未選択";
    button.title = option?.label ?? props.placeholder ?? props.label;
    options.forEach((node, index) => node.setAttribute("aria-selected", String(props.options[index].value === value)));
  }
  function choose(index: number): void {
    const option = props.options[index];
    if (!option || option.disabled || button.disabled) return;
    close();
    button.focus();
    props.onChange(option.value);
  }
  button.addEventListener("click", () => { if (opened) close(); else open(); }, { signal });
  button.addEventListener("keydown", event => {
    if (button.disabled) return;
    if (event.key === "Tab") { close(); return; }
    if (event.key === "Escape") {
      if (opened) { event.preventDefault(); event.stopPropagation(); close(); }
      return;
    }
    if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      const wasOpen = opened;
      open();
      if (event.key === "Enter" || event.key === " ") { if (wasOpen) choose(active); }
      else if (event.key === "Home") highlight(enabled[0] ?? -1);
      else if (event.key === "End") highlight(enabled.at(-1) ?? -1);
      else if (wasOpen && enabled.length) {
        const step = event.key === "ArrowDown" ? 1 : -1;
        highlight(enabled[(enabled.indexOf(active) + step + enabled.length) % enabled.length]);
      }
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing) {
      event.preventDefault();
      open();
      const now = Date.now();
      typed = now - lastType > 700 ? event.key : typed + event.key;
      lastType = now;
      const match = enabled.find(index => props.options[index].label.toLocaleLowerCase().startsWith(typed.toLocaleLowerCase()));
      if (match !== undefined) highlight(match);
    }
  }, { signal });
  popup.addEventListener("pointerdown", event => event.preventDefault(), { signal });
  document.addEventListener("pointerdown", event => {
    if (!button.contains(event.target as Node) && !popup.contains(event.target as Node)) close();
  }, { signal });
  document.addEventListener("focusin", event => { if (!button.contains(event.target as Node)) close(); }, { signal });
  window.addEventListener("resize", close, { signal });
  document.addEventListener("scroll", event => { if (!popup.contains(event.target as Node)) close(); }, { signal, capture: true });
  return {
    element: button, setValue,
    setDisabled(value: boolean) { button.disabled = value; if (value) close(); },
    dispose() { close(); controller.abort(); },
  };
}

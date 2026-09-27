import type { SelectProps } from "../components/Select";

let nextId = 0;

export function createSelectControl(props: SelectProps) {
  const controller = new AbortController();
  const signal = controller.signal;
  const searchable = props.searchable ?? false;
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
  popup.className = "ui-select-popup ui-select-menu";
  const listbox = document.createElement("div");
  listbox.className = "ui-select-options";
  listbox.id = `ui-select-${nextId++}`;
  listbox.setAttribute("role", "listbox");
  listbox.setAttribute("aria-label", props.label);
  button.setAttribute("aria-controls", listbox.id);
  const searchContainer = document.createElement("div");
  searchContainer.className = "ui-select-search";
  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "検索...";
  search.setAttribute("aria-label", `${props.label}を検索`);
  search.setAttribute("autocomplete", "off");
  searchContainer.append(search);
  if (searchable) popup.append(searchContainer);
  popup.append(listbox);
  let opened = false;
  let current: string | null = null;
  let active = -1;
  let typed = "";
  let lastType = 0;
  const options = props.options.map((option, index) => {
    const node = document.createElement("div");
    node.id = `${listbox.id}-${index}`;
    node.className = "ui-select-option";
    node.setAttribute("role", "option");
    node.setAttribute("aria-disabled", String(option.disabled ?? false));
    node.textContent = option.label;
    node.title = option.label;
    node.addEventListener("pointermove", () => { if (!option.disabled) highlight(index); }, { signal });
    node.addEventListener("click", () => choose(index), { signal });
    listbox.append(node);
    return node;
  });
  const empty = document.createElement("div");
  empty.className = "ui-select-empty";
  empty.textContent = props.options.length ? "一致する候補なし" : "候補なし";
  empty.hidden = options.length > 0;
  listbox.append(empty);

  const visibleEnabled = (): number[] => props.options
    .map((_, index) => index)
    .filter(index => !options[index].hidden && !props.options[index].disabled);

  function filter(query: string): void {
    const normalized = query.trim().toLocaleLowerCase();
    let visible = 0;
    props.options.forEach((option, index) => {
      const matches = !normalized || option.label.toLocaleLowerCase().includes(normalized);
      options[index].hidden = !matches;
      if (matches) visible++;
    });
    empty.hidden = visible > 0;
    const enabled = visibleEnabled();
    if (!enabled.includes(active)) highlight(enabled[0] ?? -1);
    position();
  }

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
    search.value = "";
    filter("");
  }
  function open(): void {
    if (button.disabled || opened) return;
    opened = true;
    document.body.append(popup);
    button.setAttribute("aria-expanded", "true");
    filter("");
    const selected = props.options.findIndex(option => option.value === current && !option.disabled);
    const enabled = visibleEnabled();
    highlight(selected >= 0 ? selected : enabled[0] ?? -1);
    if (searchable) search.focus();
    position();
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
      const enabled = visibleEnabled();
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
      const match = visibleEnabled().find(index => props.options[index].label.toLocaleLowerCase().startsWith(typed.toLocaleLowerCase()));
      if (match !== undefined) highlight(match);
    }
  }, { signal });
  search.addEventListener("input", () => filter(search.value), { signal });
  search.addEventListener("keydown", event => {
    if (event.key === "Tab") { close(); return; }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
      button.focus();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End", "Enter"].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const enabled = visibleEnabled();
    if (event.key === "Enter") choose(active);
    else if (event.key === "Home") highlight(enabled[0] ?? -1);
    else if (event.key === "End") highlight(enabled.at(-1) ?? -1);
    else if (enabled.length) {
      const step = event.key === "ArrowDown" ? 1 : -1;
      const currentIndex = enabled.indexOf(active);
      highlight(enabled[(currentIndex + step + enabled.length) % enabled.length]);
    }
  }, { signal });
  popup.addEventListener("pointerdown", event => { if (event.target !== search) event.preventDefault(); }, { signal });
  document.addEventListener("pointerdown", event => {
    if (!button.contains(event.target as Node) && !popup.contains(event.target as Node)) close();
  }, { signal });
  document.addEventListener("focusin", event => {
    if (!button.contains(event.target as Node) && !popup.contains(event.target as Node)) close();
  }, { signal });
  window.addEventListener("resize", close, { signal });
  document.addEventListener("scroll", event => { if (!popup.contains(event.target as Node)) close(); }, { signal, capture: true });
  return {
    element: button, setValue,
    setDisabled(value: boolean) { button.disabled = value; if (value) close(); },
    dispose() { close(); controller.abort(); },
  };
}

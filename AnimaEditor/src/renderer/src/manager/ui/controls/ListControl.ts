import type { ListProps } from "../components/List";

export function createListControl(props: ListProps) {
  const controller = new AbortController();
  const signal = controller.signal;
  const element = document.createElement("div");
  element.className = "ui-list";
  const content = document.createElement("div");
  content.className = "ui-list-content";
  content.setAttribute("role", "list");
  content.setAttribute("aria-label", props.label ?? "List");
  content.style.gap = `${props.gap ?? 2}px`;
  const childContainers = props.children.map(() => {
    const item = document.createElement("div");
    item.className = "ui-list-item";
    item.setAttribute("role", "listitem");
    content.append(item);
    return item;
  });
  const resizer = document.createElement("div");
  resizer.className = "ui-list-resizer";
  resizer.tabIndex = 0;
  resizer.setAttribute("role", "separator");
  resizer.setAttribute("aria-orientation", "horizontal");
  resizer.setAttribute("aria-label", `${props.label ?? "List"}: 高さ`);
  element.append(content, resizer);
  const finite = (value: number | undefined, fallback: number): number => Number.isFinite(value) ? value! : fallback;
  const min = Math.max(32, finite(props.minHeight, 64));
  const max = Math.max(min, finite(props.maxHeight, 600));
  let height = Math.max(min, Math.min(max, finite(props.height, 180)));
  let pointer: number | null = null;
  let originY = 0;
  let originalHeight = height;
  function render(): void {
    element.style.height = `${height}px`;
    resizer.setAttribute("aria-valuemin", String(min));
    resizer.setAttribute("aria-valuemax", String(max));
    resizer.setAttribute("aria-valuenow", String(height));
    resizer.setAttribute("aria-valuetext", `${height}px`);
  }
  function change(value: number): void {
    const next = Math.max(min, Math.min(max, Math.round(value)));
    if (height === next) return;
    height = next;
    render();
    props.onHeightChange?.(height);
  }
  function finish(cancel: boolean): void {
    const id = pointer;
    pointer = null;
    element.classList.remove("is-resizing");
    if (id !== null && resizer.hasPointerCapture(id)) resizer.releasePointerCapture(id);
    if (cancel && id !== null) change(originalHeight);
  }
  resizer.addEventListener("pointerdown", event => {
    if (event.button !== 0 || pointer !== null) return;
    event.preventDefault();
    event.stopPropagation();
    resizer.focus({ preventScroll: true });
    pointer = event.pointerId;
    originY = event.clientY;
    originalHeight = height;
    resizer.setPointerCapture(pointer);
    element.classList.add("is-resizing");
  }, { signal });
  resizer.addEventListener("pointermove", event => {
    if (event.pointerId === pointer) change(originalHeight + event.clientY - originY);
  }, { signal });
  resizer.addEventListener("pointerup", event => { if (event.pointerId === pointer) finish(false); }, { signal });
  resizer.addEventListener("pointercancel", () => finish(true), { signal });
  resizer.addEventListener("lostpointercapture", () => finish(true), { signal });
  window.addEventListener("blur", () => finish(true), { signal });
  resizer.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); finish(true); return; }
    const step = event.shiftKey ? 40 : 10;
    const values: Record<string, number> = { ArrowUp: height - step, ArrowDown: height + step, Home: min, End: max };
    if (event.key in values) { event.preventDefault(); event.stopPropagation(); change(values[event.key]); }
  }, { signal });
  render();
  return { element, childContainers,
    dispose(): void { controller.abort(); finish(false); element.remove(); },
  };
}

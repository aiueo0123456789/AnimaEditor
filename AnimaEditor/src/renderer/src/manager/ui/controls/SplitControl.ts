import type { SplitOptions } from "../components/Split";

export function createSplitControl(props: SplitOptions) {
  const controller = new AbortController();
  const signal = controller.signal;
  const element = document.createElement("div");
  element.className = "ui-split";
  const vertical = props.direction === "vertical";
  element.dataset.direction = vertical ? "vertical" : "horizontal";
  const first = document.createElement("div");
  const second = document.createElement("div");
  first.className = second.className = "ui-split-pane";
  const separator = document.createElement("div");
  separator.className = "ui-split-resizer";
  separator.tabIndex = 0;
  separator.setAttribute("role", "separator");
  separator.setAttribute("aria-label", props.label ?? "Resize panes");
  separator.setAttribute("aria-orientation", vertical ? "horizontal" : "vertical");
  element.append(first, separator, second);
  let ratio = Number.isFinite(props.ratio) ? Math.max(0, Math.min(1, props.ratio!)) : .5;
  let effective = ratio;
  let pointer: number | null = null;
  let startRatio = ratio;
  let offset = 0;
  const minimum = (value: number | undefined): number => Number.isFinite(value) ? Math.max(0, value!) : 60;
  function metrics() {
    const size = vertical ? element.clientHeight : element.clientWidth;
    const divider = vertical ? separator.offsetHeight : separator.offsetWidth;
    const available = Math.max(0, size - divider);
    const a = minimum(props.minFirst), b = minimum(props.minSecond);
    const scale = a + b > available ? available / (a + b) : 1;
    return { available, lower: available ? a * scale / available : 0, upper: available ? 1 - b * scale / available : 1 };
  }
  function render(): void {
    const { available, lower, upper } = metrics();
    effective = Math.max(lower, Math.min(upper, ratio));
    element.style.setProperty("--split-first", `${available * effective}px`);
    separator.setAttribute("aria-valuemin", String(Math.round(lower * 100)));
    separator.setAttribute("aria-valuemax", String(Math.round(upper * 100)));
    separator.setAttribute("aria-valuenow", String(Math.round(effective * 100)));
  }
  function change(value: number): void {
    const { lower, upper } = metrics();
    ratio = Math.max(lower, Math.min(upper, value));
    render();
    props.onRatioChange?.(ratio);
  }
  function finish(): void {
    const id = pointer;
    pointer = null;
    element.classList.remove("is-resizing");
    if (id !== null && separator.hasPointerCapture(id)) separator.releasePointerCapture(id);
    // if (cancel && id !== null) { ratio = startRatio; render(); props.onRatioChange?.(ratio); }
  }
  separator.addEventListener("pointerdown", event => {
    if (event.button !== 0 || pointer !== null) return;
    event.preventDefault();
    separator.focus();
    startRatio = ratio;
    const rect = separator.getBoundingClientRect();
    offset = vertical ? event.clientY - rect.top : event.clientX - rect.left;
    pointer = event.pointerId;
    separator.setPointerCapture(pointer);
    element.classList.add("is-resizing");
  }, { signal });
  separator.addEventListener("pointermove", event => {
    if (pointer !== event.pointerId) return;
    const rect = element.getBoundingClientRect();
    const { available } = metrics();
    if (available) change(((vertical ? event.clientY - rect.top : event.clientX - rect.left) - offset) / available);
  }, { signal });
  separator.addEventListener("pointerup", event => { if (event.pointerId === pointer) finish(); }, { signal });
  separator.addEventListener("pointercancel", () => finish(), { signal });
  separator.addEventListener("lostpointercapture", () => finish(), { signal });
  separator.addEventListener("keydown", event => {
    const step = event.shiftKey ? .1 : .01;
    const values: Record<string, number> = { Home: 0, End: 1,
      [vertical ? "ArrowUp" : "ArrowLeft"]: effective - step,
      [vertical ? "ArrowDown" : "ArrowRight"]: effective + step };
    if (event.key in values) { event.preventDefault(); event.stopPropagation(); change(values[event.key]); }
  }, { signal });
  const resize = new ResizeObserver(render);
  resize.observe(element);
  return { element, childContainers: [first, second] as const,
    setRatio(value: number): void {
      if (pointer !== null || !Number.isFinite(value) || value === ratio) return;
      ratio = Math.max(0, Math.min(1, value));
      render();
    },
    dispose(): void { controller.abort(); finish(); resize.disconnect(); element.remove(); },
  };
}

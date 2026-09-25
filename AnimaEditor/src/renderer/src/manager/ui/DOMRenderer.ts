import { isBinding } from "./components/Binding";
import type { Binding, Value } from "./components/Binding";
import type { EditorEvent } from "../EventManager";
import type { EditSession, Widget } from "./components/Widget";
import { createSelectControl } from "./controls/SelectControl";
import { createHierarchyControl } from "./controls/HierarchyControl";
import { createTimelineControl } from "./controls/TimelineControl";
import { createRenameButtonControl } from "./controls/RenameButtonControl";
import { createSplitControl } from "./controls/SplitControl";
import { configurePanelRegion } from "./controls/PanelRegion";
import { createListControl } from "./controls/ListControl";

export interface MountedWidget {
  readonly element: HTMLElement;
  readonly childContainers?: readonly HTMLElement[];
  readonly observeEvents: readonly EditorEvent[];
  refresh(): void;
  dispose(): void;
}

export interface DOMRendererOptions {
  readonly createIcon?: (name: string) => HTMLElement | SVGElement | null;
}

export class DOMRenderer {

  constructor(private readonly options: DOMRendererOptions = {}) {}

  public mount(parent: HTMLElement, widget: Widget): MountedWidget {
    const cleanups: (() => void)[] = [];
    const listeners = new AbortController();
    let disposed = false;
    let childContainers: readonly HTMLElement[] | undefined;
    const refreshers: (() => void)[] = [];
    const observeEvents: EditorEvent[] = [...(widget.props.observeEvents ?? [])];
    const watch = <T>(value: Value<T>, apply: (value: T) => void): (() => void) => {
      if (!isBinding(value)) {
        apply(value);
        return () => apply(value);
      }
      const binding: Binding<T> = value;
      const refresh = (): void => { if (!disposed) apply(binding.read()); };
      refresh();
      observeEvents.push(...(binding.observeEvents ?? []));
      refreshers.push(refresh);
      return refresh;
    };
    const on = (target: HTMLElement, event: string, handler: (event: Event) => void): void => {
      target.addEventListener(event, handler, { signal: listeners.signal });
    };
    const create = (definition: Widget): HTMLElement => {
      const props = definition.props;
      let element: HTMLElement;
      switch (definition.type) {
        case "list": {
          const control = createListControl(definition.props);
          cleanups.push(() => control.dispose());
          childContainers = control.childContainers;
          element = control.element;
          break;
        }
        case "canvas": {
          const canvas = document.createElement("canvas");
          canvas.setAttribute("aria-label", definition.props.label);
          canvas.tabIndex = 0;
          element = canvas;
          break;
        }
        case "renameButton": {
          const control = createRenameButtonControl(definition.props);
          cleanups.push(() => control.dispose());
          watch(definition.props.label, control.setLabel);
          watch(definition.props.pressed ?? false, control.setPressed);
          watch(definition.props.disabled ?? false, control.setDisabled);
          element = control.element;
          break;
        }
        case "split": {
          const control = createSplitControl(definition.props);
          cleanups.push(() => control.dispose());
          childContainers = control.childContainers;
          element = control.element;
          break;
        }
        case "timeline": {
          const control = createTimelineControl(definition.props);
          cleanups.push(() => control.dispose());
          watch(definition.props.data, control.setData);
          element = control.element;
          break;
        }
        case "hierarchy": {
          const p = definition.props;
          const control = createHierarchyControl(p);
          cleanups.push(() => control.dispose());
          watch(p.items, control.setItems);
          watch(p.selected, control.setSelected);
          watch(p.filter ?? "", control.setFilter);
          element = control.element;
          break;
        }
        case "section": {
          const details = document.createElement("details");
          details.open = definition.props.open ?? true;
          const summary = document.createElement("summary");
          summary.textContent = definition.props.title;
          details.append(summary);
          element = details;
          break;
        }
        case "header":
        case "main":
        case "row":
        case "column": {
          const p = definition.props;
          element = document.createElement(definition.type === "header" ? "header" : "div");
          element.style.display = "flex";
          element.style.flexDirection = definition.type === "header" ? definition.props.direction ?? "row" : definition.type === "row" ? "row" : "column";
          if (definition.type === "header" || definition.type === "main") configurePanelRegion(element, definition);
          element.style.gap = `${p.gap ?? 0}px`;
          const alignment = { start: "flex-start", end: "flex-end", center: "center", stretch: "stretch", "space-between": "space-between" };
          element.style.alignItems = alignment[p.align ?? "stretch"];
          element.style.justifyContent = alignment[p.justify ?? "start"];
          if (definition.type === "row" && definition.props.wrap) element.style.flexWrap = "wrap";
          break;
        }
        case "container": {
          const p = definition.props;
          element = document.createElement("div");
          element.style.padding = `${p.padding ?? 0}px`;
          element.style.flexGrow = String(p.grow ?? 0);
          element.style.overflow = p.overflow ?? "visible";
          break;
        }
        case "text": {
          const p = definition.props;
          element = document.createElement("span");
          watch(p.text, value => { element.textContent = value; });
          element.style.userSelect = p.selectable ? "text" : "none";
          break;
        }
        case "button": {
          const p = definition.props;
          const button = document.createElement("button");
          button.type = "button";
          button.setAttribute("aria-label", p.label);
          const icon = p.icon ? this.options.createIcon?.(p.icon) : null;
          if (icon) {
            icon.setAttribute("aria-hidden", "true");
            button.append(icon);
          }
          if (!p.iconOnly || !icon) button.append(document.createTextNode(p.label));
          if (p.iconOnly) button.title = p.tooltip ?? p.label;
          watch(p.disabled ?? false, value => { button.disabled = value; });
          if (p.pressed !== undefined) watch(p.pressed, value => button.setAttribute("aria-pressed", String(value)));
          on(button, "click", () => p.onPress());
          element = button;
          break;
        }
        case "select": {
          const p = definition.props;
          const control = createSelectControl(p);
          cleanups.push(() => control.dispose());
          watch(p.value, control.setValue);
          watch(p.disabled ?? false, control.setDisabled);
          element = labeled(p.label, control.element);
          break;
        }
        case "checkbox": {
          const p = definition.props;
          const input = document.createElement("input");
          input.type = "checkbox";
          input.indeterminate = p.indeterminate ?? false;
          watch(p.value, value => { input.checked = value; });
          watch(p.disabled ?? false, value => { input.disabled = value; });
          on(input, "change", () => p.onChange(input.checked));
          element = labeled(p.label, input);
          break;
        }
        case "textField":
        case "numberField":
        case "slider": {
          const p = definition.props;
          const input = document.createElement("input");
          input.type = definition.type === "textField" ? "text" : definition.type === "slider" ? "range" : "number";
          if (definition.type === "textField") {
            input.placeholder = definition.props.placeholder ?? "";
            input.readOnly = definition.props.readOnly ?? false;
          } else {
            const numeric = definition.props;
            if (numeric.min !== undefined) input.min = String(numeric.min);
            if (numeric.max !== undefined) input.max = String(numeric.max);
            input.step = String(numeric.step ?? "any");
            if (definition.type === "numberField") input.readOnly = definition.props.readOnly ?? false;
          }
          let editing = false;
          let composing = false;
          let initialValue = "";
          const session = p as EditSession<string | number>;
          const read = (): string | number | undefined => {
            if (definition.type === "textField") return input.value;
            return Number.isFinite(input.valueAsNumber) && input.validity.valid ? input.valueAsNumber : undefined;
          };
          const begin = (): void => {
            if (editing || input.disabled || input.readOnly) return;
            editing = true;
            initialValue = input.value;
            session.onBegin?.();
          };
          const refresh = watch<string | number>(p.value, value => {
            // Keep partial numbers and IME text intact during an edit session.
            if (!editing && input.value !== String(value)) input.value = String(value);
          });
          const end = (cancel: boolean): void => {
            if (!editing) return;
            editing = false;
            const value = read();
            if (cancel || value === undefined) {
              input.value = initialValue;
              session.onCancel?.();
            } else session.onCommit?.(value);
            refresh();
          };
          watch(p.disabled ?? false, value => {
            if (value) end(true);
            input.disabled = value;
          });
          const change = (): void => {
            if (composing) return;
            const value = read();
            if (value === undefined) return;
            if (definition.type === "textField") definition.props.onChange(String(value));
            else definition.props.onChange(Number(value));
          };
          on(input, "focus", begin);
          on(input, "beforeinput", begin);
          on(input, "pointerdown", begin);
          on(input, "input", () => { begin(); change(); });
          on(input, "compositionstart", () => { begin(); composing = true; });
          on(input, "compositionend", () => { composing = false; change(); });
          on(input, "change", () => { if (!composing) end(false); });
          on(input, "blur", () => { composing = false; end(false); });
          on(input, "keydown", event => {
            const key = (event as KeyboardEvent).key;
            if (composing || (event as KeyboardEvent).isComposing) return;
            if (key === "Escape") { event.preventDefault(); end(true); }
            else if (key === "Enter") end(false);
            else begin();
          });
          cleanups.push(() => end(true));
          element = labeled(p.label, input);
          break;
        }
      }
      if (props.className) element.classList.add(...props.className.split(/\s+/).filter(Boolean));
      element.dataset.widget = definition.type;
      if (props.key !== undefined) element.dataset.key = props.key;
      if (props.tooltip !== undefined) element.title = props.tooltip;
      element.style.minWidth = "0";
      return element;
    };
    let element: HTMLElement;
    try {
      element = create(widget);
      parent.append(element);
      if (widget.type === "canvas") cleanups.push(widget.props.onMount(element as HTMLCanvasElement));
      if (widget.type === "container" && widget.props.onMount) cleanups.push(widget.props.onMount(element));
    } catch (error) {
      disposed = true;
      listeners.abort();
      cleanups.reverse().forEach(cleanup => cleanup());
      throw error;
    }
    const mounted: MountedWidget = {
      element,
      childContainers,
      observeEvents,
      refresh: () => { if (!disposed) refreshers.forEach(refresh => refresh()); },
      dispose: () => {
        if (disposed) return;
        disposed = true;
        listeners.abort();
        const errors: unknown[] = [];
        for (const cleanup of cleanups.reverse()) {
          try { cleanup(); } catch (error) { errors.push(error); }
        }
        cleanups.length = 0;
        refreshers.length = 0;
        observeEvents.length = 0;
        element.remove();
        if (errors.length) throw new AggregateError(errors, "Widget cleanup failed");
      },
    };
    return mounted;
  }
}

function labeled(label: string, control: HTMLElement): HTMLLabelElement {
  const element = document.createElement("label");
  const caption = document.createElement("span");
  caption.textContent = label;
  element.append(caption, control);
  return element;
}

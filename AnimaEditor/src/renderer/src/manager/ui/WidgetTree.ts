import type { EditorEvent } from "../EventManager";
import { DOMRenderer } from "./DOMRenderer";
import type { MountedWidget } from "./DOMRenderer";
import type { Widget, WidgetChild } from "./components/Widget";

export interface WidgetHandle { readonly id: number; }
interface Entry {
  handle: WidgetHandle;
  widget: Widget;
  source: WidgetChild;
  mounted: MountedWidget;
  parent: Entry | null;
  children: Entry[];
}

// Owned by UIManager. Public handles never expose DOM, callbacks, or child entries.
export class WidgetTree {
  private readonly entries = new Map<WidgetHandle, Entry>();
  private readonly dirty = new Set<Entry>();
  private nextId = 0;

  constructor(private readonly renderer = new DOMRenderer()) {}

  public mount(host: HTMLElement, widget: WidgetChild): WidgetHandle {
    return this.create(host, widget, null).handle;
  }

  private create(host: HTMLElement, source: WidgetChild, parent: Entry | null, handle = Object.freeze({ id: this.nextId++ }), widget = typeof source === "function" ? source() : source): Entry {
    const entry: Entry = { handle, source, widget, mounted: this.renderer.mount(host, widget), parent, children: [] };
    this.entries.set(handle, entry);
    try {
      const children = widget.type === "list" || widget.type === "row" || widget.type === "column" || widget.type === "section" || widget.type === "header" || widget.type === "main" ? widget.props.children
        : widget.type === "split" ? [widget.props.first, widget.props.second]
        : widget.type === "container" && widget.props.child ? [widget.props.child] : [];
      children.forEach((child, index) => entry.children.push(this.create(entry.mounted.childContainers?.[index] ?? entry.mounted.element, child, entry)));
      return entry;
    } catch (error) {
      this.destroy(entry);
      throw error;
    }
  }

  public submitEvent(event: EditorEvent, matches: (event: EditorEvent, targets: readonly EditorEvent[]) => boolean): void {
    for (const entry of this.entries.values()) {
      if (matches(event, entry.mounted.observeEvents)) this.dirty.add(entry);
    }
  }

  public invalidate(handle: WidgetHandle): void {
    const entry = this.entries.get(handle);
    if (entry) this.dirty.add(entry);
  }

  public flush(): void {
    const pending = new Set(this.dirty);
    this.dirty.clear();
    for (const entry of pending) {
      let ancestor = entry.parent;
      while (ancestor && !pending.has(ancestor)) ancestor = ancestor.parent;
      if (!ancestor && this.entries.get(entry.handle) === entry) this.update(entry);
    }
  }

  private update(entry: Entry): void {
    if (entry.widget.props.rebuild || typeof entry.source === "function") {
      this.reset(entry.handle);
      return;
    }
    entry.mounted.refresh();
    for (const child of [...entry.children]) {
      if (this.entries.get(child.handle) === child) this.update(child);
    }
  }

  public reset(handle: WidgetHandle, widget?: WidgetChild): void {
    const entry = this.entries.get(handle);
    if (!entry) return;
    const source = widget ?? entry.widget.props.rebuild ?? entry.source;
    // Evaluate before disposal so a failing builder leaves the mounted subtree intact.
    const definition = typeof source === "function" ? source() : source;
    const host = entry.mounted.element.parentElement;
    if (!host) { this.destroy(entry); return; }
    const marker = document.createComment("widget");
    host.insertBefore(marker, entry.mounted.element);
    const parent = entry.parent;
    const index = parent?.children.indexOf(entry) ?? -1;
    try {
      this.destroy(entry);
      const replacement = this.create(host, source, parent, handle, definition);
      host.insertBefore(replacement.mounted.element, marker);
      if (parent) parent.children.splice(index, 0, replacement);
    } finally {
      marker.remove();
    }
  }

  public dispose(handle: WidgetHandle): void {
    const entry = this.entries.get(handle);
    if (entry) this.destroy(entry);
  }

  private destroy(entry: Entry): void {
    this.entries.delete(entry.handle);
    this.dirty.delete(entry);
    const errors: unknown[] = [];
    for (const child of [...entry.children]) {
      try { this.destroy(child); } catch (error) { errors.push(error); }
    }
    if (entry.parent) entry.parent.children = entry.parent.children.filter(child => child !== entry);
    entry.children.length = 0;
    try { entry.mounted.dispose(); } catch (error) { errors.push(error); }
    if (errors.length) throw new AggregateError(errors, "Widget subtree cleanup failed");
  }

  public disposeAll(): void {
    const errors: unknown[] = [];
    for (const entry of [...this.entries.values()].filter(entry => !entry.parent)) {
      try { this.destroy(entry); } catch (error) { errors.push(error); }
    }
    if (errors.length) throw new AggregateError(errors, "Widget tree cleanup failed");
  }
}

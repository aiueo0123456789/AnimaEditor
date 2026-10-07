import type { UIManager } from "./UIManager";
import type { WidgetHandle } from "./WidgetTree";
import type { ContextMenuWidget } from "./components/ContextMenu";

export type ContextMenuBuilder = (event: MouseEvent) => ContextMenuWidget | null;
export type ContextMenuSource = ContextMenuWidget | ContextMenuBuilder;
export type ContextMenuHost = Pick<UIManager, "mountWidget" | "disposeWidget">;

// Each mounted widget owns a manager; only one menu may be open at a time.
export class ContextMenuManager {
  private static active: ContextMenuManager | null = null;
  public menu: ContextMenuSource | null = null;
  private unbind: (() => void) | null = null;
  private closeMenu: (() => void) | null = null;

  public get isOpen(): boolean { return this.closeMenu !== null; }
  public static get isOpen(): boolean { return this.active !== null; }
  public input(): boolean { return ContextMenuManager.active !== null; }

  public attach(element: HTMLElement, ui: ContextMenuHost): () => void {
    this.dispose();
    const listeners = new AbortController();
    element.addEventListener("contextmenu", event => {
      // A configured child owns the event even when its builder returns null.
      event.stopPropagation();
      const menu = typeof this.menu === "function" ? this.menu(event) : this.menu;
      if (!menu) return;
      event.preventDefault();
      event.stopPropagation();
      this.show(ui, menu, event.clientX, event.clientY);
    }, { signal: listeners.signal });
    const detach = () => {
      listeners.abort();
      if (this.unbind === detach) {
        this.unbind = null;
        this.hide();
      }
    };
    this.unbind = detach;
    return detach;
  }

  public show(ui: ContextMenuHost, widget: ContextMenuWidget, x: number, y: number): void {
    ContextMenuManager.active?.hide();
    const host = document.createElement("div");
    host.className = "ui-context-menu-host";
    host.tabIndex = -1;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.append(host);
    const listeners = new AbortController();
    let handle: WidgetHandle | undefined;
    this.closeMenu = () => {
      this.closeMenu = null;
      if (ContextMenuManager.active === this) ContextMenuManager.active = null;
      listeners.abort();
      const restoreFocus = host.contains(document.activeElement);
      try { if (handle) ui.disposeWidget(handle); }
      finally {
        host.remove();
        if (restoreFocus && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      }
    };
    ContextMenuManager.active = this;
    try {
      handle = ui.mountWidget(host, widget);
      host.style.left = `${Math.max(4, Math.min(x, window.innerWidth - host.offsetWidth - 4))}px`;
      host.style.top = `${Math.max(4, Math.min(y, window.innerHeight - host.offsetHeight - 4))}px`;
      const hide = () => this.hide();
      document.addEventListener("pointerdown", event => {
        if (!host.contains(event.target as Node)) hide();
      }, { capture: true, signal: listeners.signal });
      host.addEventListener("click", event => {
        const button = (event.target as Element).closest("button");
        // Select controls and submenu triggers are editing/navigation, not commands.
        if (button && !button.disabled && button.dataset.widget === "button") hide();
      }, { signal: listeners.signal });
      host.addEventListener("contextmenu", event => event.preventDefault(), { signal: listeners.signal });
      document.addEventListener("keydown", event => {
        if (event.key === "Escape") { event.preventDefault(); hide(); }
      }, { signal: listeners.signal });
      document.addEventListener("focusin", event => {
        if (!host.contains(event.target as Node)) hide();
      }, { signal: listeners.signal });
      window.addEventListener("resize", hide, { signal: listeners.signal });
      window.addEventListener("blur", hide, { signal: listeners.signal });
      document.addEventListener("scroll", event => {
        if (!(event.target instanceof Node) || !host.contains(event.target)) hide();
      }, { capture: true, signal: listeners.signal });
      host.focus({ preventScroll: true });
    } catch (error) {
      this.hide();
      throw error;
    }
  }

  public hide(): void { this.closeMenu?.(); }
  public dispose(): void { this.unbind?.(); this.hide(); }
}

import type { HeaderWidget } from "../components/Header";
import type { MainWidget } from "../components/Main";

// Shared by managed widgets and controls that own canvas/timeline DOM directly.
export function configurePanelRegion(element: HTMLElement, widget: HeaderWidget | MainWidget): void {
  element.dataset.widget = widget.type;
  element.classList.add(widget.type === "header" ? "ui-panel-header" : "ui-panel-main");
  if (widget.type === "main") {
    element.style.overflow = widget.props.overflow ?? "auto";
    element.style.padding = `${widget.props.padding ?? 10}px`;
  }
}

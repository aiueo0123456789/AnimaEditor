import type { SubmenuProps } from "../components/Submenu";

export function createSubmenuControl(props: SubmenuProps) {
  const element = document.createElement("div");
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.textContent = props.label;
  trigger.disabled = props.disabled ?? false;
  trigger.dataset.submenuTrigger = "true";
  trigger.setAttribute("aria-haspopup", "true");
  trigger.setAttribute("aria-expanded", "false");
  const panel = document.createElement("div");
  panel.className = "ui-submenu-panel";
  panel.setAttribute("role", "group");
  panel.setAttribute("aria-label", props.label);
  panel.hidden = true;
  element.append(trigger, panel);
  const listeners = new AbortController();
  const close = () => {
    panel.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  };
  const open = () => {
    if (trigger.disabled) return;
    panel.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    const rect = trigger.getBoundingClientRect();
    const width = panel.offsetWidth, height = panel.offsetHeight;
    const left = rect.right + width <= window.innerWidth - 4 ? rect.right : rect.left - width;
    panel.style.left = `${Math.max(4, Math.min(left, window.innerWidth - width - 4))}px`;
    panel.style.top = `${Math.max(4, Math.min(rect.top, window.innerHeight - height - 4))}px`;
  };
  element.addEventListener("pointerenter", open, { signal: listeners.signal });
  element.addEventListener("pointerleave", () => {
    if (!element.contains(document.activeElement)) close();
  }, { signal: listeners.signal });
  trigger.addEventListener("click", open, { signal: listeners.signal });
  element.addEventListener("focusout", event => {
    if (!element.contains(event.relatedTarget as Node | null)) close();
  }, { signal: listeners.signal });
  element.addEventListener("keydown", event => {
    if (event.key === "ArrowRight" && event.target === trigger) {
      event.preventDefault();
      event.stopPropagation();
      open();
      panel.querySelector<HTMLElement>("button:not(:disabled), input:not(:disabled), [tabindex='0']")?.focus();
    } else if ((event.key === "ArrowLeft" || event.key === "Escape") && !panel.hidden) {
      event.preventDefault();
      event.stopPropagation();
      close();
      trigger.focus();
    }
  }, { signal: listeners.signal });
  return { element, childContainers: props.children.map(() => panel), dispose: () => listeners.abort() };
}

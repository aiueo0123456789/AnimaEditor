import type { ModalProps } from "../components/Modal";

export function createModalControl(props: ModalProps) {
  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const controller = new AbortController();
  const signal = controller.signal;
  const element = document.createElement("div");
  element.className = "ui-modal-backdrop";

  const dialog = document.createElement("section");
  dialog.className = "ui-modal-dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", props.title);
  dialog.tabIndex = -1;

  const header = document.createElement("header");
  header.className = "ui-modal-header";
  const title = document.createElement("h2");
  title.textContent = props.title;
  const close = document.createElement("button");
  close.type = "button";
  close.className = "ui-modal-close";
  close.setAttribute("aria-label", "閉じる");
  close.title = "閉じる";
  close.textContent = "×";
  header.append(title, close);

  const body = document.createElement("div");
  body.className = "ui-modal-body";
  body.style.gap = `${props.gap ?? 8}px`;
  dialog.append(header, body);
  element.append(dialog);

  close.addEventListener("click", props.onClose, { signal });
  element.addEventListener("pointerdown", event => {
    if (event.target === element) props.onClose();
  }, { signal });
  element.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      props.onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...dialog.querySelectorAll<HTMLElement>(
      "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])",
    )].filter(item => !item.hidden);
    if (!focusable.length) { event.preventDefault(); dialog.focus(); return; }
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }, { signal });
  queueMicrotask(() => (dialog.querySelector<HTMLElement>("button, input, [tabindex='0']") ?? dialog).focus());

  return {
    element,
    childContainers: props.children.map(() => body),
    dispose(): void {
      controller.abort();
      element.remove();
      if (previousFocus?.isConnected) previousFocus.focus();
    },
  };
}

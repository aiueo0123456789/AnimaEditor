import { defineWidget } from "./Widget";
import type { LayoutProps, WidgetDefinition } from "./Widget";

export interface ModalProps extends LayoutProps {
  readonly title: string;
  readonly onClose: () => void;
}

export type ModalWidget = WidgetDefinition<"modal", ModalProps>;

export function Modal(props: ModalProps): ModalWidget {
  return defineWidget("modal", { ...props, children: Object.freeze([...props.children]) });
}

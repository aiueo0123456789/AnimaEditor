import { defineWidget } from "./Widget";
import type { LayoutProps, WidgetDefinition } from "./Widget";

export interface ContextMenuProps extends LayoutProps {
  readonly label?: string;
}
export type ContextMenuWidget = WidgetDefinition<"contextMenu", ContextMenuProps>;
export function ContextMenu(props: ContextMenuProps): ContextMenuWidget {
  return defineWidget("contextMenu", { ...props, children: Object.freeze([...props.children]) });
}

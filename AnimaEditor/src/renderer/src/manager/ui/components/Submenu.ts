import { defineWidget } from "./Widget";
import type { LayoutProps, WidgetDefinition } from "./Widget";

export interface SubmenuProps extends LayoutProps {
  readonly label: string;
  readonly disabled?: boolean;
}
export type SubmenuWidget = WidgetDefinition<"submenu", SubmenuProps>;
export function Submenu(props: SubmenuProps): SubmenuWidget {
  return defineWidget("submenu", { ...props, children: Object.freeze([...props.children]) });
}

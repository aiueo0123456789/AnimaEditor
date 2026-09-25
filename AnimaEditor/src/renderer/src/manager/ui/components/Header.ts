import { defineWidget } from "./Widget";
import type { LayoutProps, WidgetDefinition } from "./Widget";

export interface HeaderProps extends LayoutProps {
  readonly direction?: "row" | "column";
}
export type HeaderWidget = WidgetDefinition<"header", HeaderProps>;
export function Header(props: HeaderProps): HeaderWidget {
  return defineWidget("header", { ...props, children: Object.freeze([...props.children]) });
}

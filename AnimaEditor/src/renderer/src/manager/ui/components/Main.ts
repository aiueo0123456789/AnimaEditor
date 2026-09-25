import { defineWidget } from "./Widget";
import type { LayoutProps, WidgetDefinition } from "./Widget";

export interface MainProps extends LayoutProps {
  readonly overflow?: "auto" | "hidden";
  readonly padding?: number;
}
export type MainWidget = WidgetDefinition<"main", MainProps>;
export function Main(props: MainProps): MainWidget {
  return defineWidget("main", { ...props, children: Object.freeze([...props.children]) });
}

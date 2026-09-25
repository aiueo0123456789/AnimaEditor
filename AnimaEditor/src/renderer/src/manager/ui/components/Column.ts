import { defineWidget } from "./Widget";
import type { LayoutProps, WidgetDefinition } from "./Widget";

export type ColumnProps = LayoutProps;
export type ColumnWidget = WidgetDefinition<"column", ColumnProps>;

export function Column(props: ColumnProps): ColumnWidget {
  return defineWidget("column", { ...props, children: Object.freeze([...props.children]) });
}

import { defineWidget } from "./Widget";
import type { LayoutProps, WidgetDefinition } from "./Widget";

export interface RowProps extends LayoutProps {
  readonly wrap?: boolean;
}
export type RowWidget = WidgetDefinition<"row", RowProps>;

export function Row(props: RowProps): RowWidget {
  return defineWidget("row", { ...props, children: Object.freeze([...props.children]) });
}

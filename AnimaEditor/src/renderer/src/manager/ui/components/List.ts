import { defineWidget } from "./Widget";
import type { WidgetChild, WidgetDefinition, WidgetProps } from "./Widget";

export interface ListProps extends WidgetProps {
  readonly children: readonly WidgetChild[];
  readonly label?: string;
  /** Initial outer height in pixels. Defaults to 180. */
  readonly height?: number;
  readonly minHeight?: number;
  readonly maxHeight?: number;
  readonly gap?: number;
  readonly onHeightChange?: (height: number) => void;
}
export type ListWidget = WidgetDefinition<"list", ListProps>;
export function List(props: ListProps): ListWidget {
  return defineWidget("list", { ...props, children: Object.freeze([...props.children]) });
}

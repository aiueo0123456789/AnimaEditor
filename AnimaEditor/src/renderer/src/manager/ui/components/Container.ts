import { defineWidget } from "./Widget";
import type { WidgetChild, WidgetDefinition, WidgetProps } from "./Widget";

export interface ContainerProps extends WidgetProps {
  readonly onMount?: (element: HTMLElement) => (() => void);
  readonly child?: WidgetChild;
  readonly padding?: number;
  readonly grow?: number;
  readonly overflow?: "visible" | "hidden" | "auto";
}
export type ContainerWidget = WidgetDefinition<"container", ContainerProps>;

export function Container(props: ContainerProps = {}): ContainerWidget {
  return defineWidget("container", props);
}

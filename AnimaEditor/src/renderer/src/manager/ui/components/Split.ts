import { defineWidget } from "./Widget";
import type { WidgetChild, WidgetDefinition, WidgetProps } from "./Widget";

export interface SplitOptions {
  /** Horizontal places first on the left; vertical places it on top. */
  readonly direction?: "horizontal" | "vertical";
  /** Initial proportion of the first pane, between 0 and 1. */
  readonly ratio?: number;
  readonly minFirst?: number;
  readonly minSecond?: number;
  readonly label?: string;
  readonly onRatioChange?: (ratio: number) => void;
}
export interface SplitProps extends WidgetProps, SplitOptions {
  readonly first: WidgetChild;
  readonly second: WidgetChild;
}
export type SplitWidget = WidgetDefinition<"split", SplitProps>;
export function Split(props: SplitProps): SplitWidget {
  return defineWidget("split", props);
}

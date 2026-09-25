import { defineWidget } from "./Widget";
import type { WidgetDefinition, WidgetProps } from "./Widget";
export interface CanvasProps extends WidgetProps {
  readonly label: string;
  readonly onMount: (canvas: HTMLCanvasElement) => (() => void);
}
export type CanvasWidget = WidgetDefinition<"canvas", CanvasProps>;
export function Canvas(props: CanvasProps): CanvasWidget { return defineWidget("canvas", props); }

import { defineWidget } from "./Widget";
import type { EditSession, InputProps, WidgetDefinition } from "./Widget";

export interface SliderProps extends InputProps<number>, EditSession<number> {
  readonly min: number;
  readonly max: number;
  readonly step?: number;
}
export type SliderWidget = WidgetDefinition<"slider", SliderProps>;

export function Slider(props: SliderProps): SliderWidget {
  return defineWidget("slider", props);
}

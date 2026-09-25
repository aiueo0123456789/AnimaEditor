import { defineWidget } from "./Widget";
import type { EditSession, InputProps, WidgetDefinition } from "./Widget";

export interface NumberFieldProps extends InputProps<number>, EditSession<number> {
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly readOnly?: boolean;
}
export type NumberFieldWidget = WidgetDefinition<"numberField", NumberFieldProps>;

export function NumberField(props: NumberFieldProps): NumberFieldWidget {
  return defineWidget("numberField", props);
}

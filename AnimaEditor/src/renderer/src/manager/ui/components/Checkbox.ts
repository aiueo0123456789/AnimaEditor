import { defineWidget } from "./Widget";
import type { InputProps, WidgetDefinition } from "./Widget";

export interface CheckboxProps extends InputProps<boolean> {
  readonly indeterminate?: boolean;
}
export type CheckboxWidget = WidgetDefinition<"checkbox", CheckboxProps>;

export function Checkbox(props: CheckboxProps): CheckboxWidget {
  return defineWidget("checkbox", props);
}

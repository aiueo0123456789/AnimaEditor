import { defineWidget } from "./Widget";
import type { InputProps, WidgetDefinition } from "./Widget";

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}
export interface SelectProps extends InputProps<string | null> {
  readonly options: readonly SelectOption[];
  readonly placeholder?: string;
}
export type SelectWidget = WidgetDefinition<"select", SelectProps>;

export function Select(props: SelectProps): SelectWidget {
  return defineWidget("select", {
    ...props,
    options: Object.freeze(props.options.map(option => Object.freeze({ ...option }))),
  });
}

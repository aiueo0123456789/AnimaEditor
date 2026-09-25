import { defineWidget } from "./Widget";
import type { Value } from "./Binding";
import type { WidgetDefinition, WidgetProps } from "./Widget";

export interface ButtonProps extends WidgetProps {
  readonly label: string;
  readonly icon?: string;
  readonly iconOnly?: boolean;
  readonly disabled?: Value<boolean>;
  readonly pressed?: Value<boolean>;
  readonly onPress: () => void;
}
export type ButtonWidget = WidgetDefinition<"button", ButtonProps>;

export function Button(props: ButtonProps): ButtonWidget {
  return defineWidget("button", props);
}

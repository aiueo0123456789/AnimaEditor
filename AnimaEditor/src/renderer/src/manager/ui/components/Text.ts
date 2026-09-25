import { defineWidget } from "./Widget";
import type { Value } from "./Binding";
import type { WidgetDefinition, WidgetProps } from "./Widget";

export interface TextProps extends WidgetProps {
  readonly text: Value<string>;
  readonly selectable?: boolean;
}
export type TextWidget = WidgetDefinition<"text", TextProps>;

export function Text(props: TextProps): TextWidget {
  return defineWidget("text", props);
}

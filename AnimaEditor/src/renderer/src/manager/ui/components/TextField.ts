import { defineWidget } from "./Widget";
import type { EditSession, InputProps, WidgetDefinition } from "./Widget";

export interface TextFieldProps extends InputProps<string>, EditSession<string> {
  readonly placeholder?: string;
  readonly readOnly?: boolean;
}
export type TextFieldWidget = WidgetDefinition<"textField", TextFieldProps>;

export function TextField(props: TextFieldProps): TextFieldWidget {
  return defineWidget("textField", props);
}

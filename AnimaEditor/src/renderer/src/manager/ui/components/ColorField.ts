import { defineWidget } from "./Widget";
import type { InputProps, WidgetDefinition } from "./Widget";

export type ColorFieldWidget = WidgetDefinition<"colorField", InputProps<string>>;
// RGB hex value; alpha is edited separately by the owning UI.
export function ColorField(props: InputProps<string>): ColorFieldWidget {
  return defineWidget("colorField", props);
}

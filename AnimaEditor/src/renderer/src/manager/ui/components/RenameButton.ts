import { defineWidget } from "./Widget";
import type { Value } from "./Binding";
import type { WidgetDefinition, WidgetProps } from "./Widget";

export interface RenameButtonProps extends WidgetProps {
  readonly label: Value<string>;
  readonly pressed?: Value<boolean>;
  readonly disabled?: Value<boolean>;
  readonly onPress: () => void;
  readonly onRename: (name: string) => void;
}
export type RenameButtonWidget = WidgetDefinition<"renameButton", RenameButtonProps>;
export function RenameButton(props: RenameButtonProps): RenameButtonWidget {
  return defineWidget("renameButton", props);
}

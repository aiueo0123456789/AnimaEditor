import { defineWidget } from "./Widget";
import type { WidgetProps, WidgetDefinition } from "./Widget";
import type { Value } from "./Binding";

export interface HierarchyItem {
  readonly id: string;
  readonly label: string;
  readonly children?: readonly HierarchyItem[];
  readonly selectable?: boolean;
  readonly renamable?: boolean;
}
export interface HierarchyProps extends WidgetProps {
  readonly label: string;
  readonly items: Value<readonly HierarchyItem[]>;
  readonly selected: Value<string | null>;
  readonly filter?: Value<string>;
  readonly onSelect: (id: string) => void;
  readonly onRename?: (id: string, name: string) => void;
}
export type HierarchyWidget = WidgetDefinition<"hierarchy", HierarchyProps>;
export function Hierarchy(props: HierarchyProps): HierarchyWidget {
  return defineWidget("hierarchy", props);
}

import { defineWidget } from "./Widget";
import type { LayoutProps, WidgetDefinition } from "./Widget";

export interface SectionProps extends LayoutProps {
  readonly title: string;
  readonly open?: boolean;
}
export type SectionWidget = WidgetDefinition<"section", SectionProps>;
export function Section(props: SectionProps): SectionWidget {
  return defineWidget("section", { ...props, children: Object.freeze([...props.children]) });
}

import type { ButtonWidget } from "./Button";
import type { ListWidget } from "./List";
import type { CanvasWidget } from "./Canvas";
import type { RenameButtonWidget } from "./RenameButton";
import type { SplitWidget } from "./Split";
import type { HeaderWidget } from "./Header";
import type { MainWidget } from "./Main";
import type { CheckboxWidget } from "./Checkbox";
import type { ColumnWidget } from "./Column";
import type { ContainerWidget } from "./Container";
import type { NumberFieldWidget } from "./NumberField";
import type { RowWidget } from "./Row";
import type { SelectWidget } from "./Select";
import type { SliderWidget } from "./Slider";
import type { TextWidget } from "./Text";
import type { TextFieldWidget } from "./TextField";
import type { Value } from "./Binding";
import type { SectionWidget } from "./Section";
import type { HierarchyWidget } from "./Hierarchy";
import type { TimelineWidget } from "./Timeline";
import type { EditorEvent } from "../../EventManager";

export interface WidgetProps {
  readonly observeEvents?: readonly EditorEvent[];
  // When present, an update replaces this subtree using the latest editor state.
  readonly rebuild?: () => Widget;
  readonly key?: string;
  readonly className?: string;
  readonly tooltip?: string;
}

export interface WidgetDefinition<T extends string, P extends WidgetProps> {
  readonly type: T;
  readonly props: Readonly<P>;
}

export type Widget = ListWidget | CanvasWidget | ButtonWidget | RenameButtonWidget | CheckboxWidget | ColumnWidget |
  ContainerWidget | NumberFieldWidget | RowWidget | SelectWidget |
  SliderWidget | TextWidget | TextFieldWidget | SectionWidget | HierarchyWidget | TimelineWidget | SplitWidget | HeaderWidget | MainWidget;

export interface LayoutProps extends WidgetProps {
  readonly children: readonly WidgetChild[];
  readonly gap?: number;
  readonly align?: "start" | "center" | "end" | "stretch";
  readonly justify?: "start" | "center" | "end" | "space-between";
}

// Evaluated on mount and again when the resulting widget or its parent updates.
export type WidgetBuilder = () => Widget;
export type WidgetChild = Widget | WidgetBuilder;

export interface InputProps<T> extends WidgetProps {
  readonly label: string;
  readonly value: Value<T>;
  readonly disabled?: Value<boolean>;
  readonly onChange: (value: T) => void;
}

// An input session can map to one InteractionCommand, including cancellation.
export interface EditSession<T> {
  readonly onBegin?: () => void;
  readonly onCommit?: (value: T) => void;
  readonly onCancel?: () => void;
}

// Factories only create descriptions; the UI runtime owns DOM and subscriptions.
export function defineWidget<T extends string, P extends WidgetProps>(
  type: T,
  props: P,
): WidgetDefinition<T, P> {
  return Object.freeze({ type, props: Object.freeze({ ...props,
    observeEvents: Object.freeze([...(props.observeEvents ?? [])]),
  }) });
}

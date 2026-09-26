import { defineWidget } from "./Widget";
import type { WidgetDefinition, WidgetProps } from "./Widget";
import type { Value } from "./Binding";

export type TimelineKind = "armature" | "sprite" | "other";
export interface TimelineTrack {
  readonly id: string;
  readonly label: string;
  readonly kind: TimelineKind;
  readonly path?: string;
  readonly group?: { readonly id: string; readonly label: string };
  readonly keyframes: readonly { id: string; frame: number; selected: boolean }[];
}
export interface TimelineData {
  readonly frameStart: number;
  readonly frameEnd: number;
  readonly currentFrame: number;
  readonly playing: boolean;
  readonly tracks: readonly TimelineTrack[];
}
export interface TimelineViewState {
  visibleKinds: TimelineKind[];
  zoom: number;
  trackRatio: number;
  collapsedPaths?: string[];
}
export interface TimelineProps extends WidgetProps {
  readonly viewState?: TimelineViewState;
  readonly data: Value<TimelineData>;
  readonly onPlay: (playing: boolean) => void;
  readonly onSeek: (frame: number) => void;
  readonly onSelectKeyframe: (trackID: string, keyframeID: string, additive: boolean) => void;
}
export type TimelineWidget = WidgetDefinition<"timeline", TimelineProps>;
export function Timeline(props: TimelineProps): TimelineWidget {
  return defineWidget("timeline", props);
}

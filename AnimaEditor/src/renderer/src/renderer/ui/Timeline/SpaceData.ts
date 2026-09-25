import type { TimelineViewState } from "../../../manager/ui/components/Timeline";

export class UIComponent_Timeline_SpaceData implements TimelineViewState {
  public visibleKinds: TimelineViewState["visibleKinds"] = ["armature", "sprite", "other"];
  public zoom = 12;
  public trackRatio = 0.25;
}

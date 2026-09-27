import type { TimelineViewState } from "../../../manager/ui/components/Timeline";
import { SpaceData } from "../UI";

export class UIComponent_Timeline_SpaceData extends SpaceData implements TimelineViewState {
  public visibleKinds: TimelineViewState["visibleKinds"] = ["armature", "sprite", "other"];
  public zoom = 12;
  public trackRatio = 0.25;
}

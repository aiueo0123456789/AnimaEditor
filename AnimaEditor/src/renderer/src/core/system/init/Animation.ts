import { Runtime_Animation } from "../../projectCache/runtime/Animation";
import { System } from "../System";

export class System_Init_Animation extends System {
  public override start(): void {}
  public override end(): void {}

  public override update(): void {
    for (const runtime of this.editor.projectCache.getRuntimesByType(Runtime_Animation)) {
      const previous = new Map([...runtime.trackIDMap].map(([id, index]) => [id, runtime.tracks[index]]));
      const tracks = Object.entries(runtime.model.tracks);
      runtime.trackIDMap.clear();
      runtime.tracks = tracks.map(([trackID, modelTrack], index) => {
        const track = previous.get(trackID) ?? Runtime_Animation.createTrack();
        runtime.trackIDMap.set(trackID, index);
        track.path = modelTrack.path;
        const previousKeys = new Map(track.keyframes.map(key => [key.id, key]));
        // Sort only the runtime copy; editing must not reorder the saved keys.
        const keys = modelTrack.keyframes.filter(key => Number.isFinite(key.frame) && Number.isFinite(key.value))
          .slice().sort((a, b) => a.frame - b.frame);
        track.keyframeIDMap.clear();
        track.keyframes = keys.map((source, keyIndex) => {
          const key = previousKeys.get(source.id) ?? Runtime_Animation.createKeyframe();
          key.id = source.id;
          key.frame = source.frame;
          key.value = source.value;
          key.interpolation = source.interpolation;
          track.keyframeIDMap.set(key.id, keyIndex);
          return key;
        });
        return track;
      });
    }
  }
}

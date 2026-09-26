import { Runtime_Animation } from "../../projectCache/runtime/Animation";
import { System } from "../System";

const forbidden = new Set(["__proto__", "prototype", "constructor", "model"]);

function resolveProperty(target: object, path: string): { object: Record<string, unknown>; key: string } | null {
  const parts = path.split(path.includes("/") ? "/" : ".");
  if (parts.some(part => !part || forbidden.has(part))) return null;
  let current: unknown = target;
  for (let i = 0; i < parts.length; i++) {
    if (current === null || typeof current !== "object") return null;
    const object = current as Record<string, unknown>;
    const key = parts[i];
    if (!Object.hasOwn(object, key)) return null;
    if (i === parts.length - 1) return { object, key };
    current = object[key];
  }
  return null;
}

export class System_Animation extends System {
  public override start(): void {}
  public override end(): void {}

  private getValue(frame: number, keys: Runtime_Animation.Keyframe[]): number | undefined {
    if (!keys.length || !Number.isFinite(frame)) return undefined;
    // Upper bound also gives the last key at a duplicate frame precedence.
    let low = 0, high = keys.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (keys[middle].frame <= frame) low = middle + 1;
      else high = middle;
    }
    if (low === 0) return keys[0].value;
    const left = keys[low - 1], right = keys[low];
    if (!right) return left.value;
    const t = (frame - left.frame) / (right.frame - left.frame);
    return left.value + (right.value - left.value) * t;
  }

  public override update(): void {
    const scene = this.editor.projectCache.sceneConfig;
    const config = this.editor.project.animationConfig;
    if (scene.isPlay) {
      const duration = config.frameEnd - config.frameStart;
      if (Number.isFinite(duration) && duration > 0 && Number.isFinite(config.frameSpeed)) {
        const frame = Number.isFinite(scene.currentFrame) ? scene.currentFrame : config.frameStart;
        scene.currentFrame = config.frameStart + ((frame + config.frameSpeed - config.frameStart) % duration + duration) % duration;
      } else {
        scene.currentFrame = Number.isFinite(config.frameStart) ? config.frameStart : 0;
        scene.isPlay = false;
      }
    }
    for (const animation of this.editor.projectCache.getRuntimesByType(Runtime_Animation)) {
      if (!animation.target) continue;
      for (const track of animation.tracks) {
        const value = this.getValue(scene.currentFrame, track.keyframes);
        if (value === undefined) continue;
        const property = resolveProperty(animation.target, track.path);
        if (property && typeof property.object[property.key] === "number") property.object[property.key] = value;
      }
    }
  }
}

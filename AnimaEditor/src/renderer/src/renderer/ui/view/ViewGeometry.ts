import { Model_Armature } from "../../../core/project/model/Armature";
import { Model_Sprite } from "../../../core/project/model/Sprite";
import { Runtime_Armature } from "../../../core/projectCache/runtime/Armature";
import { Runtime_Sprite } from "../../../core/projectCache/runtime/Sprite";
import type { Vec2 } from "../../../util/vecMath";
import { ViewEditModes } from "../../../editor/editorState/ViewEditModes";

export type ViewGeometrySource = "model" | "runtime";

export function geometrySource(mode: ViewEditModes): ViewGeometrySource {
  return mode === ViewEditModes.VERTEX || mode === ViewEditModes.BONE ? "model" : "runtime";
}

export function spritePoints(model: Model_Sprite, runtime: Runtime_Sprite | null, source: ViewGeometrySource): { id: string; position: Vec2 }[] {
  if (source === "model") return Object.entries(model.vertices).map(([id, vertex]) => ({ id, position: [...vertex.co] }));
  if (!runtime) return [];
  return [...runtime.vertexIDMap].flatMap(([id, index]) => {
    const position = runtime.vertices[index];
    return position && model.vertices[id] ? [{ id, position: [...position] as Vec2 }] : [];
  });
}

export function boneGeometry(armature: Runtime_Armature, source: ViewGeometrySource): { id: string; head: Vec2; tail: Vec2; packed: number[] }[] {
  if (source === "model") return Object.entries(armature.model.bones).map(([id, bone]) => {
    const dx = bone.tail[0] - bone.head[0], dy = bone.tail[1] - bone.head[1];
    return { id, head: [...bone.head], tail: [...bone.tail],
      packed: [...bone.head, 1, 1, Math.atan2(dy, dx), Math.hypot(dx, dy)] };
  });
  return armature.bones.map(bone => {
    const pose = bone.pose;
    const length = bone.base.length * pose.scale[0];
    return { id: bone.id, head: [...pose.position],
      tail: [pose.position[0] + Math.cos(pose.rotation) * length, pose.position[1] + Math.sin(pose.rotation) * length],
      packed: [...pose.position, ...pose.scale, pose.rotation, bone.base.length] };
  });
}

export function bonePoints(model: Model_Armature, runtime: Runtime_Armature | null, source: ViewGeometrySource): { id: string; head: Vec2; tail: Vec2 }[] {
  if (source === "model") return Object.entries(model.bones).map(([id, bone]) => ({ id, head: [...bone.head], tail: [...bone.tail] }));
  return runtime ? boneGeometry(runtime, source) : [];
}

import { Model_Armature } from "../../../../core/project/model/Armature";
import { Model_Sprite } from "../../../../core/project/model/Sprite";
import { Runtime_Armature } from "../../../../core/projectCache/runtime/Armature";
import { Runtime_Sprite } from "../../../../core/projectCache/runtime/Sprite";
import { ArmatureState } from "../../../../editor/editorState/state/States/Armature";
import { SpriteState } from "../../../../editor/editorState/state/States/Sprite";
import type { AnimaEditor, ID } from "../../../../editor/Editor";
import type { PropertyEdit } from "../../../../editor/command/interactionCommand/SetPropertiesCommand";
import type { Vec2 } from "../../../../util/vecMath";
import type { UIComponent_View } from "../View";
import { bonePoints, geometrySource, spritePoints } from "../ViewGeometry";

export interface PointSelection {
  edits: PropertyEdit[];
  hit: boolean;
  changed: boolean;
}

function sameIDs(a: readonly ID[], b: readonly ID[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

function segmentDistance(point: Vec2, head: Vec2, tail: Vec2): number {
  const dx = tail[0] - head[0], dy = tail[1] - head[1];
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return Infinity;
  const t = Math.max(0, Math.min(1,
    ((point[0] - head[0]) * dx + (point[1] - head[1]) * dy) / lengthSquared));
  return Math.hypot(point[0] - head[0] - t * dx, point[1] - head[1] - t * dy);
}

export function pointSelection(editor: AnimaEditor, view: UIComponent_View, point: Vec2, additive: boolean): PointSelection | null {
  const model = editor.editorState.activeObject;
  if (!model) return null;
  const state = editor.editorState.getModelStateByID(model.id);
  const runtime = editor.projectCache.getRuntimeByID(model.id);
  const source = geometrySource(editor.editorState.editMode);

  if (model instanceof Model_Sprite && state instanceof SpriteState) {
    let closest: ID | null = null;
    let distance = 12 / view.camera.zoom;
    for (const item of spritePoints(model, runtime instanceof Runtime_Sprite ? runtime : null, source)) {
      const next = Math.hypot(item.position[0] - point[0], item.position[1] - point[1]);
      if (next <= distance) { closest = item.id; distance = next; }
    }
    const before = state.selectedVertexIDs;
    let after: ID[];
    if (closest === null) after = additive ? [...before] : [];
    else if (before.includes(closest)) after = [...before];
    else after = additive ? [...before, closest] : [closest];
    return {
      edits: [{ model: state, path: "selectedVertexIDs", value: after }],
      hit: closest !== null,
      changed: !sameIDs(before, after),
    };
  }

  if (model instanceof Model_Armature && state instanceof ArmatureState) {
    const bones = bonePoints(model, runtime instanceof Runtime_Armature ? runtime : null, source);
    let endpoint: { id: ID; group: 0 | 1 } | null = null;
    let distance = 12 / view.camera.zoom;
    for (const bone of bones) for (const item of [
      { id: bone.id, position: bone.head, group: 0 as const },
      { id: bone.id, position: bone.tail, group: 1 as const },
    ]) {
      const next = Math.hypot(item.position[0] - point[0], item.position[1] - point[1]);
      if (next <= distance) { endpoint = { id: item.id, group: item.group }; distance = next; }
    }
    let shaft: ID | null = null;
    if (!endpoint) {
      distance = 8 / view.camera.zoom;
      for (const bone of bones) {
        const next = segmentDistance(point, bone.head, bone.tail);
        if (next <= distance) { shaft = bone.id; distance = next; }
      }
    }
    const before = [state.selectedHeadIDs, state.selectedTailIDs] as const;
    const selected = before.map(ids => new Set(additive ? ids : []));
    const hit = endpoint !== null || shaft !== null;
    const alreadySelected = endpoint
      ? before[endpoint.group].includes(endpoint.id)
      : shaft !== null && before.every(ids => ids.includes(shaft));
    if (alreadySelected) before.forEach((ids, index) => { selected[index] = new Set(ids); });
    else if (endpoint) selected[endpoint.group].add(endpoint.id);
    else if (shaft !== null) { selected[0].add(shaft); selected[1].add(shaft); }
    const after = selected.map(ids => [...ids]);
    return {
      edits: ["selectedHeadIDs", "selectedTailIDs"].map((path, index) => ({ model: state, path, value: after[index] })),
      hit,
      changed: !sameIDs(before[0], after[0]) || !sameIDs(before[1], after[1]),
    };
  }
  return null;
}

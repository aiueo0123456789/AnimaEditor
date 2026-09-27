import { Model_Animation } from "../../../core/project/model/Animation";
import { Runtime_Armature } from "../../../core/projectCache/runtime/Armature";
import { Runtime_Sprite } from "../../../core/projectCache/runtime/Sprite";
import type { AnimaEditor, ID } from "../../Editor";
import { CommandReturn } from "../primitiveCommand/PrimitiveCommand";
import { InteractionCommand } from "./InteractionCommand";

type AnimationTarget = Runtime_Armature | Runtime_Sprite;
type Action = {
  trackID: ID;
  keyframeID: ID;
  index: number;
  keyframe: Model_Animation.Keyframe;
  beforeValue?: number;
  afterValue: number;
  insert: boolean;
};

export interface InsertKeyframeCommandInput {
  target: AnimationTarget;
  frame: number;
  paths?: readonly string[];
}

export class InsertKeyframeCommand extends InteractionCommand {
  private animation: Model_Animation | null = null;
  private actions: Action[] = [];

  constructor(editor: AnimaEditor, private readonly data: InsertKeyframeCommandInput) {
    super(editor, data);
  }

  public begin(): CommandReturn {
    if (this.commited || !Number.isFinite(this.data.frame)) return CommandReturn.ERROR;
    const model = this.editor.project.getModelByID(this.data.target.model.animation.animationID);
    if (!(model instanceof Model_Animation)) return CommandReturn.ERROR;
    this.animation = model;

    const requested = this.data.paths ? new Set(this.data.paths) : null;
    const values = new Map<ID, number>();
    for (const [path, trackID] of Object.entries(this.data.target.model.animation.trackMap)) {
      if (requested && !requested.has(path)) continue;
      const value = this.data.target.getAnimationValue(path);
      if (model.tracks[trackID] && typeof value === "number" && Number.isFinite(value)) values.set(trackID, value);
    }

    this.actions = [];
    for (const [trackID, value] of values) {
      const track = model.tracks[trackID];
      const index = track.keyframes.reduce((found, keyframe, keyIndex) => keyframe.frame === this.data.frame ? keyIndex : found, -1);
      if (index >= 0) {
        const keyframe = track.keyframes[index];
        if (keyframe.value !== value) this.actions.push({ trackID, keyframeID: keyframe.id, index, keyframe, beforeValue: keyframe.value, afterValue: value, insert: false });
      } else {
        const keyframe = Model_Animation.createKeyframe({ frame: this.data.frame, value });
        this.actions.push({ trackID, keyframeID: keyframe.id, index: track.keyframes.length, keyframe, afterValue: value, insert: true });
      }
    }
    return this.actions.length ? this.redo() : CommandReturn.ERROR;
  }

  public update(): CommandReturn { return CommandReturn.ERROR; }

  private currentIndex(action: Action): number {
    return this.animation?.tracks[action.trackID]?.keyframes.findIndex(keyframe => keyframe.id === action.keyframeID) ?? -1;
  }

  public redo(): CommandReturn {
    if (!this.animation) return CommandReturn.ERROR;
    if (this.actions.some(action => action.insert ? this.currentIndex(action) >= 0 : this.currentIndex(action) < 0)) return CommandReturn.ERROR;
    for (const action of this.actions) {
      const path = `tracks.${action.trackID}.keyframes`;
      if (action.insert) this.api.insertElement(this.animation, path, Math.min(action.index, this.animation.tracks[action.trackID].keyframes.length), action.keyframe);
      else this.api.setProperty(this.animation, `${path}.${this.currentIndex(action)}.value`, action.afterValue);
    }
    return CommandReturn.FINISHED;
  }

  public undo(): CommandReturn {
    if (!this.animation || this.actions.some(action => this.currentIndex(action) < 0)) return CommandReturn.ERROR;
    for (const action of [...this.actions].reverse()) {
      const index = this.currentIndex(action);
      const path = `tracks.${action.trackID}.keyframes`;
      if (action.insert) this.api.deleteElementByIndex(this.animation, path, index);
      else this.api.setProperty(this.animation, `${path}.${index}.value`, action.beforeValue);
    }
    return CommandReturn.FINISHED;
  }

  public cancel(): CommandReturn { return this.commited ? CommandReturn.ERROR : this.undo(); }
}

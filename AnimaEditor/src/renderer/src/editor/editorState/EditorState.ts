import { Model_Animation } from "../../core/project/model/Animation";
import { Model_Armature } from "../../core/project/model/Armature";
import { Model_Sprite } from "../../core/project/model/Sprite";
import { Model_Texture } from "../../core/project/model/Texture";
import { Models } from "../../core/project/Project";
import { ID } from "../Editor";
import { AnimationState } from "./state/Animation";
import { ArmatureState } from "./state/Armature";
import { SpriteState } from "./state/Sprite";
import { TextureState } from "./state/Texture";

export enum EditModes {
  Object = "Object",
  Vertex = "Vertex"
}

export type States = SpriteState | ArmatureState | AnimationState | TextureState;

export class EditorState {
  public activeObject: Models | null;
  public hoverObject: Models | null;
  public selectedObjects: Models[];

  // オブジェクトごとの選択情報を持つオブジェクト
  public states: States[];

  public editMode: EditModes;

  constructor() {
    this.activeObject = null;
    this.hoverObject = null;
    this.selectedObjects = [];

    this.states = [];

    this.editMode = EditModes.Object;
  }

  public setActiveObject(activeObject: Models | null): void {
    this.activeObject = activeObject;
  }

  public setHoverObject(hoverObject: Models | null): void {
    this.hoverObject = hoverObject;
  }

  public addTexture(model: Model_Texture): TextureState {
    return new TextureState(model);
  }
  public addAnimation(model: Model_Animation): AnimationState {
    return new AnimationState(model);
  }
  public addSprite(model: Model_Sprite): SpriteState {
    return new SpriteState(model);
  }
  public addArmature(model: Model_Armature): ArmatureState {
    return new ArmatureState(model);
  }

  public getModelStateByID(id: ID): States | null {
    for (const modelState of this.states) {
      if (modelState.id === id) {
        return modelState;
      }
    }
    return null;
  }

  public clear(): void {
    this.activeObject = null;
    this.hoverObject = null;
    this.selectedObjects.length = 0;
    this.editMode = EditModes.Object;
    this.states.length = 0;
  }
}

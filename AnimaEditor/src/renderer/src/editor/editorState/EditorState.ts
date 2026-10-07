import { Model_Animation } from "../../core/project/model/Animation";
import { Model_Armature } from "../../core/project/model/Armature";
import { Model_Sprite } from "../../core/project/model/Sprite";
import { Model_Texture } from "../../core/project/model/Texture";
import { ID } from "../Editor";
import { AnimationState } from "./state/States/Animation";
import { ArmatureState } from "./state/States/Armature";
import { SpriteState } from "./state/States/Sprite";
import { TextureState } from "./state/States/Texture";
import { ViewEditModes } from "./ViewEditModes";
import { ObjectSelection, AnimationSelection, TextureSelection, type SelectionDomain } from "./Selection";

export type States = SpriteState | ArmatureState | AnimationState | TextureState;

export class EditorState {
  public editMode = ViewEditModes.OBJECT;

  public objects = new ObjectSelection();
  public animations = new AnimationSelection();
  public textures = new TextureSelection();
  public inspectorDomain: SelectionDomain = "objects";

  public get activeObject(): Model_Armature | Model_Sprite | null {
    const model = this.getModelStateByID(this.objects.activeObjectID ?? "")?.model;
    return model instanceof Model_Armature || model instanceof Model_Sprite ? model : null;
  }
  public get activeAnimation(): Model_Animation | null {
    const model = this.getModelStateByID(this.animations.activeAnimationID ?? "")?.model;
    return model instanceof Model_Animation ? model : null;
  }
  public get activeTexture(): Model_Texture | null {
    const model = this.getModelStateByID(this.textures.activeTextureID ?? "")?.model;
    return model instanceof Model_Texture ? model : null;
  }
  public get inspectedModel() {
    return this.inspectorDomain === "animations" ? this.activeAnimation
      : this.inspectorDomain === "textures" ? this.activeTexture : this.activeObject;
  }

  // オブジェクトごとの選択情報を持つオブジェクト
  public states: States[];

  constructor() {
    this.states = [];
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
}

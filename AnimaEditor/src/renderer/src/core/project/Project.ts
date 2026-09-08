import { Model_Sprite, Model_SpriteInput } from "./model/Sprite";
import { Model_Texture, Model_TextureInput } from "./model/Texture";
import { Model_Animation, Model_AnimationInput } from "./model/Animation";
import { Model_Armature, Model_ArmatureInput } from "./model/Armature";
import { Model_AnimationConfigInput, Model_AnimationConfig } from "./configModel/Animation";
import { Model_SceneConfigInput, Model_SceneConfig } from "./configModel/Scene";
import { ID } from "../../editor/Editor";
import { Model, ModelInput } from "./Model";

export type Models = Model_Sprite | Model_Armature | Model_Animation | Model_Texture;
export type TypeofModels = typeof Model_Sprite | typeof Model_Armature | typeof Model_Animation | typeof Model_Texture;

export enum ModelNames {
  Sprite = "Sprite",
  Aramature = "Aramature",
  Animation = "Animation",
  Texture = "Texture",
  SceneConfig = "SceneConfig",
  AnimationConfig = "AnimationConfig"
}

export interface ProjectInput {
  sceneConfig: Model_SceneConfigInput,
  animationConfig: Model_AnimationConfigInput,
  models: ModelInput[],
}

export class Project {
  public models: Models[];

  public sceneConfig: Model_SceneConfig;
  public animationConfig: Model_AnimationConfig;

  constructor(data: ProjectInput) {
    this.models = [];

    this.sceneConfig = new Model_SceneConfig(data.sceneConfig);
    this.animationConfig = new Model_AnimationConfig(data.animationConfig);
  }

  createSceneConfig(data: Model_SceneConfigInput): Model_SceneConfig {
    return new Model_SceneConfig(data);
  }

  createAnimationConfig(data: Model_AnimationConfigInput): Model_AnimationConfig {
    return new Model_AnimationConfig(data);
  }

  createAnimation(data: Model_AnimationInput): Model_Animation {
    return new Model_Animation(data);
  }

  createTexture(data: Model_TextureInput): Model_Texture {
    return new Model_Texture(data);
  }

  createSprite(data: Model_SpriteInput): Model_Sprite {
    return new Model_Sprite(data);
  }

  createArmature(data: Model_ArmatureInput): Model_Armature {
    return new Model_Armature(data);
  }

  removeModel(id: ID): Models | null {
    const index = this.models.map(model => model.id).indexOf(id);
    if (index === -1) {
      return null;
    }
    return this.models.splice(index, 1)[0];
  }

  getModelByID(id: ID): Models | null {
    for (const model of this.models) {
      if (model.id === id) return model;
    }
    return null;
  }

  public getModelsByType<T extends Model>(type: new (...args: any[]) => T): T[] {
    const result: T[] = [];
    for (const model of this.models) {
      if (model instanceof type) {
        result.push(model);
      }
    }
    return result;
  }
}

import { Model_Animation } from "../project/model/Animation";
import { BoneReference, Model_Armature } from "../project/model/Armature";
import { Model_Sprite } from "../project/model/Sprite";
import { Runtime_Texture } from "./runtime/Texture";
import { Runtime } from "./Runtime";
import { Runtime_Animation } from "./runtime/Animation";
import { Runtime_Armature, Runtime_Bone } from "./runtime/Armature";
import { Runtime_Sprite } from "./runtime/Sprite";
import { Model_Texture } from "../project/model/Texture";
import { ID } from "../../editor/Editor";
import { SceneConfigRuntime } from "./configRuntime/Scene";
import { Project } from "../project/Project";
import { Model } from "../project/Model";

export type Runtimes = Runtime_Sprite | Runtime_Armature | Runtime_Animation | Runtime_Texture;
export type TypeofRuntimes = typeof Runtime_Sprite | typeof Runtime_Armature | typeof Runtime_Animation | typeof Runtime_Texture;

export class ProjectCache {
  public runtimes: Runtimes[];
  public sceneConfig: SceneConfigRuntime;
  constructor(project: Project) {
    this.runtimes = [];

    this.sceneConfig = new SceneConfigRuntime(project.sceneConfig);
  }

  public addTexture(model: Model_Texture): Runtime_Texture {
    return new Runtime_Texture(model);
  }

  public addAnimation(model: Model_Animation): Runtime_Animation {
    return new Runtime_Animation(model);
  }

  public addSprite(model: Model_Sprite): Runtime_Sprite {
    return new Runtime_Sprite(model);
  }

  public addArmature(model: Model_Armature): Runtime_Armature {
    return new Runtime_Armature(model);
  }

  public getRuntimesByID(id: ID): Runtimes | null {
    for (const runtime of this.runtimes) {
      if (runtime.id === id) {
        return runtime;
      }
    }
    return null;
  }

  // T extends Runtimeこれは実際にclassを作っているわけじゃなくてTはRuntimeの子classである必要があるという条件
  // : new (...args: any[]) => Tこれはおまじないみたいなもの
  public getRuntimesByType<T extends Runtime<Model>>(type: new (...args: any[]) => T): T[] {
    const result: T[] = [];
    for (const runtime of this.runtimes) {
      if (runtime instanceof type) {
        result.push(runtime);
      }
    }
    return result;
  }

  public clear(): void {
    this.runtimes.length = 0;
  }
}

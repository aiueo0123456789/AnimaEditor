import { AnimaEditor } from "../../../editor/Editor";
import { Models } from "../../project/Project";

import { System } from "../System";
import { ReferenceResolver } from "../../projectCache/Runtime";
import { Runtimes } from "../../projectCache/ProjectCache";
import { Runtime_Armature } from "../../projectCache/runtime/Armature";
import { BoneReference } from "../../project/model/Armature";
import { ModelReference } from "../../project/Model";

export class System_Runtime extends System {
  constructor(editor: AnimaEditor) {
    super(editor);
  }

  public override start(): void {
  }

  public override end(): void {
  }

  private _updateObject(editor: AnimaEditor, runtime: Runtimes): void {

    function resolver(path: string[], referenceResolver: ReferenceResolver, objectRuntime: Runtimes, objectModel: Models) {
      let targetRuntime = objectRuntime;
      let targetModel = objectModel;
      for (let pathI = 0; pathI < path.length; pathI++) {
        const key = path[pathI];
        if (key === ReferenceResolver.PATH.ARRAY && Array.isArray(targetRuntime)) {
          for (let i = 0; i < targetRuntime.length; i++) {
            resolver(path.slice(pathI + 1), referenceResolver, targetRuntime[i], targetModel[i]);
          }
          return;
        }
        if (pathI === path.length - 1) {
          const searchID = targetModel[referenceResolver.id];
          const current = targetRuntime[key];
          if (searchID instanceof ModelReference && searchID.modelID !== current?.id) {
            targetRuntime[key] = editor.projectCache.getRuntimesByID(searchID.modelID);
          } else if (searchID instanceof BoneReference && searchID.boneID !== current?.id) {
            const armature = editor.projectCache.getRuntimesByID(searchID.aramatureID);
            if (armature instanceof Runtime_Armature) targetRuntime[key] = armature.getBoneByID(searchID.boneID);
          }
        } else {
          targetRuntime = targetRuntime[key];
          targetModel = targetModel[key];
        }
      }
    }

    const loop = (map: Record<string, any>, path: string[] = []) => {
      for (const key in map) {
        if (map[key] instanceof ReferenceResolver) {
          resolver(path.concat(key), map[key], runtime, runtime.model);
        } else {
          loop(map[key], path.concat(key));
        }
      }
    };

    loop(runtime.constructor.referenceResolver);
  }

  public override update(): void {
    for (const runtime of this.editor.projectCache.runtimes) {
      this._updateObject(this.editor, runtime);
    }
  }
}

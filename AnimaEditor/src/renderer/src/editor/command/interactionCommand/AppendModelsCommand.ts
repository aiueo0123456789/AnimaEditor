import type { Models } from "../../../core/project/Project";
import { ModelNames } from "../../../core/project/Project";
import type { Model_AnimationInput } from "../../../core/project/model/Animation";
import type { Model_ArmatureInput } from "../../../core/project/model/Armature";
import type { Model_SpriteInput } from "../../../core/project/model/Sprite";
import type { Model_TextureInput } from "../../../core/project/model/Texture";
import type { Runtimes } from "../../../core/projectCache/ProjectCache";
import type { States } from "../../editorState/EditorState";
import type { AnimaEditor, ID } from "../../Editor";
import { CommandReturn } from "../primitiveCommand/PrimitiveCommand";
import { InteractionCommand, type InteractionCommandInput } from "./InteractionCommand";

export type AppendModelInput = Model_SpriteInput | Model_ArmatureInput | Model_AnimationInput | Model_TextureInput;

export interface AppendModelsCommandInput extends InteractionCommandInput {
  models: AppendModelInput[];
}

export type AppendModelsCommandUpdate = AppendModelsCommandInput;

interface AppendedObject {
  model: Models;
  runtime: Runtimes;
  state: States;
}

function remapReference(id: ID | undefined, ids: Map<ID, ID>, existing: Set<ID>): ID {
  if (!id) return "";
  return ids.get(id) ?? (existing.has(id) ? id : "");
}

export function prepareAppendedModels(editor: AnimaEditor, inputs: AppendModelInput[]): AppendModelInput[] {
  const existing = new Set(editor.project.models.map(model => model.id));
  const ids = new Map<ID, ID>();
  for (const input of inputs) if (input.id) ids.set(input.id, crypto.randomUUID());
  const masks = new Set(Object.keys(editor.project.sceneConfig.masks));

  return inputs.map(input => {
    const result = structuredClone(input) as AppendModelInput;
    result.id = input.id ? ids.get(input.id)! : crypto.randomUUID();
    if (result.modelName === ModelNames.Sprite) {
      const sprite = result as Model_SpriteInput;
      sprite.texture.modelID = remapReference(sprite.texture?.modelID, ids, existing);
      if (sprite.animation) sprite.animation.animationID = remapReference(sprite.animation.animationID, ids, existing);
      for (const weight of Object.values(sprite.boneWeights ?? {})) {
        weight.boneID.aramatureID = remapReference(weight.boneID.aramatureID, ids, existing);
      }
      const targets = Array.isArray(sprite.maskTarget) ? sprite.maskTarget : sprite.maskTarget ? [sprite.maskTarget] : [];
      sprite.maskTarget = targets.filter(reference => masks.has(reference.maskID));
      if (sprite.maskSource && !masks.has(sprite.maskSource.maskID)) sprite.maskSource.maskID = "";
    } else if (result.modelName === ModelNames.Aramature) {
      const armature = result as Model_ArmatureInput;
      if (armature.animation) armature.animation.animationID = remapReference(armature.animation.animationID, ids, existing);
      for (const bone of Object.values(armature.bones ?? {})) {
        bone.parentID.aramatureID = remapReference(bone.parentID.aramatureID, ids, existing);
      }
    }
    return result;
  });
}

export class AppendModelsCommand extends InteractionCommand {
  private objects: AppendedObject[] = [];

  constructor(editor: AnimaEditor, data: AppendModelsCommandInput) {
    super(editor, data);
    this.objects = this.createObjects(data.models);
  }

  private createObjects(models: AppendModelInput[]): AppendedObject[] {
    try {
      const objects = prepareAppendedModels(this.editor, models).map(data => this.editor.createModel(data));
      return objects.every((object): object is AppendedObject => !!object.model && !!object.runtime && !!object.state)
        ? objects : [];
    } catch (error) {
      console.warn("アペンドするモデルを生成できませんでした", error);
      return [];
    }
  }

  public begin(): CommandReturn {
    if (this.commited || !this.objects.length) return CommandReturn.ERROR;
    return this.redo();
  }

  public update(data: AppendModelsCommandUpdate): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;
    const previous = this.objects;
    const next = this.createObjects(data.models);
    if (!next.length || this.undo() === CommandReturn.ERROR) return CommandReturn.ERROR;
    this.objects = next;
    if (this.redo() === CommandReturn.ERROR) {
      this.objects = previous;
      this.redo();
      return CommandReturn.ERROR;
    }
    return CommandReturn.FINISHED;
  }

  public redo(): CommandReturn {
    const ids = this.objects.map(object => object.model.id);
    if (new Set(ids).size !== ids.length || this.objects.some(object => this.editor.project.getModelByID(object.model.id)))
      return CommandReturn.ERROR;
    for (const object of this.objects) {
      this.api.pushElement(this.editor.project, "models", object.model);
      this.api.pushElement(this.editor.projectCache, "runtimes", object.runtime);
      this.api.pushElement(this.editor.editorState, "states", object.state);
    }
    return CommandReturn.FINISHED;
  }

  public undo(): CommandReturn {
    if (this.objects.some(object => !this.editor.project.models.includes(object.model) ||
      !this.editor.projectCache.runtimes.includes(object.runtime) || !this.editor.editorState.states.includes(object.state)))
      return CommandReturn.ERROR;
    for (const object of [...this.objects].reverse()) {
      this.api.deleteElementByIndex(this.editor.editorState, "states", this.editor.editorState.states.indexOf(object.state));
      this.api.deleteElementByIndex(this.editor.projectCache, "runtimes", this.editor.projectCache.runtimes.indexOf(object.runtime));
      this.api.deleteElementByIndex(this.editor.project, "models", this.editor.project.models.indexOf(object.model));
    }
    return CommandReturn.FINISHED;
  }

  public cancel(): CommandReturn {
    return this.commited ? CommandReturn.ERROR : this.undo();
  }
}

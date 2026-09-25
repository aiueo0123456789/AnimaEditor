import { AnimaEditor } from "../../../editor/Editor";
import { ModelReference } from "../../project/Model";
import { BoneReference } from "../../project/model/Armature";
import { Runtime_Armature } from "../../projectCache/runtime/Armature";
import { System } from "../System";

export class System_Runtime_ReferencesResolver {
  private editor: AnimaEditor;
  constructor(editor: AnimaEditor) {
    this.editor = editor;
  }

  bone(boneReference: BoneReference) {
    const aramature = this.editor.projectCache.getRuntimesByID(boneReference.aramatureID);
    if (aramature instanceof Runtime_Armature) return aramature.getBoneByID(boneReference.boneID);
    else return null;
  }

  model(modelReference: ModelReference) {
    return this.editor.projectCache.getRuntimesByID(modelReference.modelID);
  }
}

export class System_Runtime extends System {
  public resolver: System_Runtime_ReferencesResolver;
  constructor(editor: AnimaEditor) {
    super(editor);
    this.resolver = new System_Runtime_ReferencesResolver(editor);
  }

  public override start(): void {
  }

  public override end(): void {
  }

  public override update(): void {
    for (const runtime of this.editor.projectCache.runtimes) {
      runtime.resolveReferences(this.resolver);
    }
  }
}

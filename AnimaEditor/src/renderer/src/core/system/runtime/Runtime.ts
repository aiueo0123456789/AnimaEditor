import { AnimaEditor } from "../../../editor/Editor";
import { ModelReference } from "../../project/Model";
import { AnimationReference } from "../../project/model/Animation";
import { BoneReference } from "../../project/model/Armature";
import { Runtime_Animation } from "../../projectCache/runtime/Animation";
import { Runtime_Armature } from "../../projectCache/runtime/Armature";
import { System } from "../System";

export class Runtime_AnimationReference {
  public animation: Runtime_Animation | null;
  public trackMap: Record<string, Runtime_Animation.Track | null>;
  constructor(animation: Runtime_Animation | null, trackMap: Record<string, Runtime_Animation.Track | null>) {
    this.animation = animation;
    this.trackMap = trackMap;
  }
}
export class System_Runtime_ReferencesResolver {
  private editor: AnimaEditor;
  constructor(editor: AnimaEditor) {
    this.editor = editor;
  }

  animation(animationReference: AnimationReference): Runtime_AnimationReference {
    const animation = this.editor.projectCache.getRuntimeByID(animationReference.animationID);
    if (animation instanceof Runtime_Animation) {
      const tracks = Object.fromEntries(Object.entries(animationReference.trackMap).map(([path, trackID]) => {
        const trackIndex = animation.trackIDMap.get(trackID);
        if (typeof trackIndex !== "number") return [path, null];
        return [path, animation.tracks[trackIndex] ?? null];
      }));
      return new Runtime_AnimationReference(animation, tracks);
    }
    else return new Runtime_AnimationReference(null, {});
  }

  bone(boneReference: BoneReference) {
    const aramature = this.editor.projectCache.getRuntimeByID(boneReference.aramatureID);
    if (aramature instanceof Runtime_Armature) return aramature.getBoneByID(boneReference.boneID);
    else return null;
  }

  model(modelReference: ModelReference) {
    return this.editor.projectCache.getRuntimeByID(modelReference.modelID);
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

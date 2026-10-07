
import { ID } from "../../../editor/Editor";
import { Vec2, Vec2Math, Vec3, Vec3Math } from "../../../util/vecMath";
import { Model_Sprite } from "../../project/model/Sprite";
import { Runtime_AnimationReference, Runtime_MaskReference, System_Runtime_ReferencesResolver } from "../../system/runtime/Runtime";
import { Runtime } from "../Runtime";
import { Runtime_Bone } from "./Armature";
import { Runtime_Texture } from "./Texture";

class BoneWeight {
  public boneWeightID: ID;
  public bone: Runtime_Bone | null;
  public weights: number[];
  constructor(boneWeightID: ID) {
    this.boneWeightID = boneWeightID;
    this.bone = null;
    this.weights = [];
  }
}

type Runtime_Edge = [number, number];

enum MaskType {
  Default = 0,
  Reverse = 1,
}

export class Runtime_Sprite extends Runtime<Model_Sprite>  {
  static MaskType = MaskType;

  static createIndex(): Vec3 {
    return Vec3Math.create();
  }

  static createVertex(): Vec2 {
    return Vec2Math.create();
  }

  static createTexcoord(): Vec2 {
    return Vec2Math.create();
  }

  static createBoneWeight(boneWeightID: ID): BoneWeight {
    return new BoneWeight(boneWeightID);
  }

  static createEdge(): Runtime_Edge {
    return [0, 0];
  }

  public vertices: Vec2[] = [];
  public animation = new Runtime_AnimationReference(null, {});
  public indices: Vec3[] = [];
  public silhouetteEdges: Runtime_Edge[] = [];
  public edges: Runtime_Edge[] = [];
  public texcoords: Vec2[] = [];
  public boneWeights: BoneWeight[] = [];
  public texture: Runtime_Texture | null = null;
  public zIndex: number = 0;

  public vertexIDMap: Map<ID, number> = new Map();
  public edgeIDMap: Map<ID, number> = new Map();
  public silhouetteEdgeIDMap: Map<ID, number> = new Map();
  public boneWeightIDMap: Map<ID, number> = new Map();

  public maskTarget: Runtime_MaskReference[] = [];
  public maskSource = new Runtime_MaskReference(null);
  public alpha: number = 1;
  public maskType: MaskType = MaskType.Default;

  public override model: Model_Sprite;

  constructor(model: Model_Sprite) {
    super(model);
    this.model = model;
  }

  get verticesNum() {
    return this.vertices.length;
  }

  get indicesNum() {
    return this.indices.length;
  }

  get silhouetteEdgesNum() {
    return this.silhouetteEdges.length;
  }

  get edgesNum() {
    return this.edges.length;
  }

  getAnimationTarget(): string[] {
    return ["alpha", ...Object.keys(this.model.vertices).flatMap(id => [`vertices.${id}.0`, `vertices.${id}.1`])];
  }

  getAnimationValue(path: string): number | undefined {
    if (path === "alpha") return this.alpha;
    const parts = path.split(".");
    if (parts.length !== 3 || parts[0] !== "vertices" || (parts[2] !== "0" && parts[2] !== "1")) return undefined;
    const index = this.vertexIDMap.get(parts[1]);
    return index === undefined ? undefined : this.vertices[index]?.[Number(parts[2])];
  }

  setAnimation(): void {
    this.alpha = Number.isFinite(this.model.alpha) ? Math.max(0, Math.min(1, this.model.alpha)) : 1;
    // Init restores the base mesh each frame, so vertex channels must also apply each frame.
    for (const [path, track] of Object.entries(this.animation.trackMap)) {
      if (track?.value === undefined || !Number.isFinite(track.value)) continue;
      if (path === "alpha") {
        this.alpha = Math.max(0, Math.min(1, track.value));
        continue;
      }
      const parts = path.split(".");
      if (parts.length !== 3 || parts[0] !== "vertices" || (parts[2] !== "0" && parts[2] !== "1")) continue;
      const index = this.vertexIDMap.get(parts[1]);
      if (index !== undefined && this.vertices[index]) this.vertices[index][Number(parts[2])] = track.value;
    }
  }

  resolveReferences(referencesResolver: System_Runtime_ReferencesResolver): void {
    this.maskType = this.model.maskType;
    this.maskTarget = this.model.maskTarget.map(reference => referencesResolver.mask(reference));
    this.maskSource = referencesResolver.mask(this.model.maskSource);
    this.animation = referencesResolver.animation(this.model.animation);
    Object.entries(this.model.boneWeights).forEach(([boneWeightID, modelBoneWeight]) => {
      const runtimeBoneWeightIndex = this.boneWeightIDMap.get(boneWeightID);
      if (typeof runtimeBoneWeightIndex !== "number") return ;
      const runtimeBoneWeight = this.boneWeights[runtimeBoneWeightIndex];
      runtimeBoneWeight.bone = referencesResolver.bone(modelBoneWeight.boneID);
    })
    const newTexture = referencesResolver.model(this.model.texture);
    this.texture = newTexture instanceof Runtime_Texture ? newTexture : null;
  }
}

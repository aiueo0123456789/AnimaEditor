
import { ID } from "../../../editor/Editor";
import { Vec2, Vec2Math, Vec3, Vec3Math } from "../../../util/vecMath";
import { Model_Sprite } from "../../project/model/Sprite";
import { System_Runtime_ReferencesResolver } from "../../system/runtime/Runtime";
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

export class Runtime_Sprite extends Runtime<Model_Sprite>  {
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

  resolveReferences(referencesResolver: System_Runtime_ReferencesResolver): void {
    Object.entries(this.model.boneWeights).forEach(([boneWeightID, modelBoneWeight]) => {
      const runtimeBoneWeightIndex = this.boneWeightIDMap.get(boneWeightID);
      if (typeof runtimeBoneWeightIndex !== "number") return ;
      const runtimeBoneWeight = this.boneWeights[runtimeBoneWeightIndex];
      runtimeBoneWeight.bone = referencesResolver.bone(modelBoneWeight.boneID);
    })
    const newTexture = referencesResolver.model(this.model.textureID);
    if (newTexture instanceof Runtime_Texture) this.texture = newTexture;
  }
}

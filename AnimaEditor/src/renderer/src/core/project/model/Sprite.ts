
import { ID } from "../../../editor/Editor";
import { Vec2, Vec2Math } from "../../../util/vecMath";
import { Model, ModelInput, ModelReference, ModelReferenceInput } from "../Model";
import { BoneReference, BoneReferenceInput } from "./Armature";
import { AnimationReference, type AnimationReferenceInput } from "./Animation";
import { MaskReference, MaskReferenceInput } from "../configModel/Scene";

interface BBox {
  min: Vec2,
  max: Vec2,
}

export type BoneWeightID = ID;
interface BoneWeightInput {
  boneID: BoneReferenceInput,
  weights: Record<ID, number>, // 頂点のweight
  name: string,
}

class BoneWeight {
  public boneID: BoneReference;
  public weights: Record<string, number>;
  public name: string;
  constructor(data: BoneWeightInput) {
    this.boneID = new BoneReference(data.boneID);
    this.weights = data.weights;
    this.name = data.name ?? "名称未設定";
  }
}

interface VertexInput {
  co?: Vec2,
}

export type VertexID = ID;
export type EdgeID = ID;

interface EdgeInput {
  vertices: [ID, ID],
}

export interface Model_SpriteInput extends ModelInput {
  alpha?: number;
  animation?: AnimationReferenceInput;
  texture: ModelReferenceInput,
  textureRect?: BBox,
  vertices?: Record<VertexID, VertexInput>,
  silhouetteEdges?: Record<EdgeID, EdgeInput>,
  edges?: Record<EdgeID, EdgeInput>,
  boneWeights?: Record<BoneWeightID, BoneWeightInput>,
  zIndex: number;
  maskTarget?: MaskReferenceInput[] | MaskReferenceInput;
  maskSource?: MaskReferenceInput;
  maskType?: 0 | 1;
}

class Vertex {
  public co: Vec2;
  constructor(data: VertexInput) {
    this.co = data.co ?? Vec2Math.create();
  }
}

class Edge {
  public vertices: [ID, ID];
  constructor(data: EdgeInput) {
    this.vertices = data.vertices;
  }
}

export class Model_Sprite extends Model {
  static createVertex(data: VertexInput) {
    return new Vertex(data);
  }

  static createBoneWeight(data: BoneWeightInput) {
    return new BoneWeight(data);
  }

  static createEdge(data: EdgeInput) {
    return new Edge(data);
  }

  public texture: ModelReference;
  public animation: AnimationReference;
  public textureRect: BBox;
  public vertices: Record<VertexID, Vertex>;
  public silhouetteEdges: Record<EdgeID, Edge>;
  public edges: Record<EdgeID, Edge>;
  public boneWeights: Record<BoneWeightID, BoneWeight>;
  public center: Vec2; // テクスチャの中心
  public zIndex: number;
  public alpha: number;
  public maskTarget: MaskReference[];
  public maskSource: MaskReference;
  public maskType: 0 | 1;

  constructor(data: Model_SpriteInput) {
    super(data);
    this.animation = new AnimationReference(data.animation);

    this.texture = new ModelReference(data.texture);

    this.textureRect = data.textureRect ?? {
      min: Vec2Math.create(),
      max: Vec2Math.create(),
    };
    this.center = Vec2Math.create();

    this.zIndex = data.zIndex ?? 0;
    this.alpha = Number.isFinite(data.alpha) ? Math.max(0, Math.min(1, data.alpha!)) : 1;

    this.vertices = Object.fromEntries(Object.entries(data.vertices ?? {}).map(([id, vertex]) => [id, Model_Sprite.createVertex(vertex)]));
    this.silhouetteEdges = Object.fromEntries(Object.entries(data.silhouetteEdges ?? {}).map(([edgeID, edge]) => [edgeID, Model_Sprite.createEdge(edge)]));
    this.edges = Object.fromEntries(Object.entries(data.edges ?? {}).map(([edgeID, edge]) => [edgeID, Model_Sprite.createEdge(edge)]));

    this.boneWeights = Object.fromEntries(Object.entries(data.boneWeights ?? {}).map(([boneWeightID, boneWeight]) => [boneWeightID, Model_Sprite.createBoneWeight(boneWeight)]));

    // Accept saved projects using the former single-reference representation.
    const maskTargets = Array.isArray(data.maskTarget) ? data.maskTarget : data.maskTarget?.maskID ? [data.maskTarget] : [];
    this.maskTarget = maskTargets.map(reference => new MaskReference(reference));
    this.maskSource = data.maskSource ? new MaskReference(data.maskSource) : new MaskReference({maskID: ""});
    this.maskType = data.maskType === 1 ? 1 : 0;
  }

  get verticesNum() {
    return Object.keys(this.vertices).length;
  }

  get edgesNum() {
    return Object.keys(this.edges).length;
  }

  get silhouetteEdgesNum() {
    return Object.keys(this.silhouetteEdges).length;
  }

  get boneWeightsNum() {
    return Object.keys(this.boneWeights).length;
  }
}

export namespace Model_Armature {
  export type Vertex = InstanceType<typeof Vertex>;
  export type Edge = InstanceType<typeof Edge>;
  export type BoneWeight = InstanceType<typeof BoneWeight>;
}

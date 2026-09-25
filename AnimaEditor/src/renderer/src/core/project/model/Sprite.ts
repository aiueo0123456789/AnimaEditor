
import { ID } from "../../../editor/Editor";
import { Vec2, Vec2Math } from "../../../util/vecMath";
import { Model, ModelInput, ModelReference, ModelReferenceInput } from "../Model";
import { BoneReference, BoneReferenceInput } from "./Armature";

interface BBox {
  min: Vec2,
  max: Vec2,
}

export type BoneWeightID = ID;
export interface Model_BoneWeightInput {
  boneID: BoneReferenceInput,
  weights: Record<ID, number>, // 頂点のweight
  name: string,
}

export class Model_BoneWeight {
  public boneID: BoneReference;
  public weights: Record<string, number>;
  public name: string;
  constructor(data: Model_BoneWeightInput) {
    this.boneID = new BoneReference(data.boneID);
    this.weights = data.weights;
    this.name = data.name ?? "名称未設定";
  }
}

export interface Model_VertexInput {
  co?: Vec2,
}

export type VertexID = ID;
export type EdgeID = ID;

export interface Model_EdgeInput {
  vertices: [ID, ID],
}

export interface Model_SpriteInput extends ModelInput {
  textureID: ModelReferenceInput,
  textureRect?: BBox,
  vertices?: Record<VertexID, Model_VertexInput>,
  silhouetteEdges?: Record<EdgeID, Model_EdgeInput>,
  edges?: Record<EdgeID, Model_EdgeInput>,
  boneWeights?: Record<BoneWeightID, Model_BoneWeightInput>,
  zIndex: number;
}

export class Model_Vertex {
  public co: Vec2;
  constructor(data: Model_VertexInput) {
    this.co = data.co ?? Vec2Math.create();
  }
}

export class Model_Edge {
  public vertices: [ID, ID];
  constructor(data: Model_EdgeInput) {
    this.vertices = data.vertices;
  }
}

export class Model_Sprite extends Model {
  static createVertex(data: Model_VertexInput) {
    return new Model_Vertex(data);
  }

  static createBoneWeight(data: Model_BoneWeightInput) {
    return new Model_BoneWeight(data);
  }

  static createEdge(data: Model_EdgeInput) {
    return new Model_Edge(data);
  }

  public textureID: ModelReference;
  public textureRect: BBox;
  public vertices: Record<VertexID, Model_Vertex>;
  public silhouetteEdges: Record<EdgeID, Model_Edge>;
  public edges: Record<EdgeID, Model_Edge>;
  public boneWeights: Record<BoneWeightID, Model_BoneWeight>;
  public center: Vec2; // テクスチャの中心
  public zIndex: number;

  constructor(data: Model_SpriteInput) {
    super(data);

    this.textureID = new ModelReference(data.textureID);

    this.textureRect = data.textureRect ?? {
      min: Vec2Math.create(),
      max: Vec2Math.create(),
    };
    this.center = Vec2Math.create();

    this.zIndex = data.zIndex ?? 0;

    this.vertices = Object.fromEntries(Object.entries(data.vertices ?? {}).map(([id, vertex]) => [id, Model_Sprite.createVertex(vertex)]));
    this.silhouetteEdges = Object.fromEntries(Object.entries(data.silhouetteEdges ?? {}).map(([edgeID, edge]) => [edgeID, Model_Sprite.createEdge(edge)]));
    this.edges = Object.fromEntries(Object.entries(data.edges ?? {}).map(([edgeID, edge]) => [edgeID, Model_Sprite.createEdge(edge)]));

    this.boneWeights = Object.fromEntries(Object.entries(data.boneWeights ?? {}).map(([boneWeightID, boneWeight]) => [boneWeightID, Model_Sprite.createBoneWeight(boneWeight)]));
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

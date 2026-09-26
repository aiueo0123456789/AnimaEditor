
import { ID } from "../../../editor/Editor";
import { Vec2, Vec2Math } from "../../../util/vecMath";
import { Model, ModelInput, ModelReference, ModelReferenceInput } from "../Model";
import { BoneReference, BoneReferenceInput } from "./Armature";

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
  textureID: ModelReferenceInput,
  textureRect?: BBox,
  vertices?: Record<VertexID, VertexInput>,
  silhouetteEdges?: Record<EdgeID, EdgeInput>,
  edges?: Record<EdgeID, EdgeInput>,
  boneWeights?: Record<BoneWeightID, BoneWeightInput>,
  zIndex: number;
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

  public textureID: ModelReference;
  public textureRect: BBox;
  public vertices: Record<VertexID, Vertex>;
  public silhouetteEdges: Record<EdgeID, Edge>;
  public edges: Record<EdgeID, Edge>;
  public boneWeights: Record<BoneWeightID, BoneWeight>;
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

export namespace Model_Armature {
  export type Vertex = InstanceType<typeof Vertex>;
  export type Edge = InstanceType<typeof Edge>;
  export type BoneWeight = InstanceType<typeof BoneWeight>;
}
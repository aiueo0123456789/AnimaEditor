
import { ID } from "../../../editor/Editor";
import { Vec2, Vec2Math } from "../../../util/vecMath";
import { Model, ModelInput, ModelReference, ModelReferenceInput } from "../Model";
import { BoneReference, BoneReferenceInput } from "./Armature";

interface BBox {
  min: Vec2,
  max: Vec2,
}

interface BoneWeightInput {
  id?: ID,
  boneID: BoneReferenceInput,
  weights: number[], // 頂点のweight
  name: string,
}

export class Model_BoneWeight {
  public id: ID;
  public boneID: BoneReference;
  public weights: number[];
  public name: string;
  constructor(data: BoneWeightInput) {
    this.id = data.id ?? crypto.randomUUID();
    this.boneID = new BoneReference(data.boneID);
    this.weights = data.weights;
    this.name = data.name ?? "名称未設定";
  }
}

export interface Model_VertexInput {
  id?: ID,
  co?: Vec2,
}

export interface Model_EdgeInput {
  id?: ID,
  vertices: [ID, ID],
}

export interface Model_SpriteInput extends ModelInput {
  textureID: ModelReferenceInput,
  textureRect?: BBox,
  vertices?: Model_VertexInput[],
  silhouetteEdges?: Model_EdgeInput[],
  edges?: Model_EdgeInput[],
  boneWeights?: BoneWeightInput[],
  zIndex: number;
}

export class Model_Vertex {
  public id: ID;
  public co: Vec2;
  constructor(data: Model_VertexInput) {
    this.id = data.id ?? crypto.randomUUID();
    this.co = data.co ?? Vec2Math.create();
  }
}

export class Model_Edge {
  public id: ID;
  public vertices: [ID, ID];
  constructor(data: Model_EdgeInput) {
    this.id = data.id ?? crypto.randomUUID();
    this.vertices = data.vertices;
  }
}

export class Model_Sprite extends Model {
  static createVertex(data: Model_VertexInput) {
    return new Model_Vertex(data);
  }

  static createBoneWeight(data: BoneWeightInput) {
    return new Model_BoneWeight(data);
  }

  static createEdge(data: Model_EdgeInput) {
    return new Model_Edge(data);
  }

  public textureID: ModelReference;
  public textureRect: BBox;
  public vertices: Model_Vertex[];
  public silhouetteEdges: Model_Edge[];
  public edges: Model_Edge[];
  public boneWeights: Model_BoneWeight[];
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

    this.vertices = data.vertices?.map(vertex => Model_Sprite.createVertex(vertex)) ?? [];
    this.silhouetteEdges = data.silhouetteEdges?.map(edge => Model_Sprite.createEdge(edge)) ?? [];
    this.edges = data.edges?.map(edge => Model_Sprite.createEdge(edge)) ?? [];

    this.boneWeights = data.boneWeights ? data.boneWeights.map((boneWeight) => Model_Sprite.createBoneWeight(boneWeight)) : [];
  }

  get verticesNum() {
    return this.vertices.length;
  }

  get edgesNum() {
    return this.edges.length;
  }
}

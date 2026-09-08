
import { ID } from "../../../editor/Editor";
import { Vec2, Vec2Math, Vec3, Vec3Math } from "../../../util/vecMath";
import { Model_Sprite } from "../../project/model/Sprite";
import { ReferenceResolver, Runtime } from "../Runtime";
import { Runtime_Bone } from "./Armature";
import { Runtime_Texture } from "./Texture";


class WeightGroup {
  public id: ID;
  public weights: number[];
  public target: string;
  constructor() {
    this.id = "";
    this.weights = [];

    this.target = "";
  }
}

class BoneWeight {
  public bone: Runtime_Bone | null;
  public weights: number[];
  constructor() {
    this.bone = null;
    this.weights = [];
  }
}

type Runtime_Edge = [number, number];

export class Runtime_Sprite extends Runtime {
  static createIndex(): Vec3 {
    return Vec3Math.create();
  }

  static createVertex(): Vec2 {
    return Vec2Math.create();
  }

  static createTexcoord(): Vec2 {
    return Vec2Math.create();
  }

  static createBoneWeight(): BoneWeight {
    return new BoneWeight();
  }

  static createEdge(): Runtime_Edge {
    return [0, 0];
  }

  static referenceResolver = {
    texture: new ReferenceResolver("textureID"),
    boneWeights: {
      [ReferenceResolver.PATH.ARRAY]: {
        bone: new ReferenceResolver("boneID"),
      },
    },
  };

  public vertices: Vec2[];
  public indices: Vec3[];
  public silhouetteEdges: Runtime_Edge[];
  public edges: Runtime_Edge[];
  public texcoords: Vec2[];
  public boneWeights: BoneWeight[];
  public weightGroups: WeightGroup[];
  public texture: Runtime_Texture | null;
  public zIndex: number;

  public vertexIDMap: Map<ID, number>;
  public edgeIDMap: Map<ID, number>;
  public silhouetteEdgeIDMap: Map<ID, number>;

  public override model: Model_Sprite;

  constructor(model: Model_Sprite) {
    super(model);
    this.model = model;
    this.vertices = [];
    this.indices = [];
    this.silhouetteEdges = [];
    this.edges = [];
    this.texcoords = [];
    this.boneWeights = [];
    this.weightGroups = [];
    this.texture = null;
    this.zIndex = 0;

    this.vertexIDMap = new Map();
    this.edgeIDMap = new Map();
    this.silhouetteEdgeIDMap = new Map();
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
}

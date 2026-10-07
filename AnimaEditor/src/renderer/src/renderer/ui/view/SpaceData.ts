import { Runtime_Armature } from "../../../core/projectCache/runtime/Armature";
import { Runtime_Sprite } from "../../../core/projectCache/runtime/Sprite";
import { ID } from "../../../editor/Editor";
import { simpleWebGPU } from "../../../util/simpleWebGPU";
import { SpaceData } from "../UI";
import { View_ArmatureRenderData } from "./renderData/ArmatureRenderData";
import { View_SpriteRenderData } from "./renderData/SpriteRenderData";
import { AddBoneTool } from "./tool/AddBoneTool";
import { AddEdgeTool } from "./tool/AddEdgeTool";
import { GenerateSilhouetteTool } from "./tool/GenerateSilhouetteTool";
import { AddVertexTool } from "./tool/AddVertexTool";
import { DeleteBoneTool } from "./tool/DeleteBoneTool";
import { DeleteEdgeTool } from "./tool/DeleteEdgeTool";
import { DeleteVertexTool } from "./tool/DeleteVertexTool";
import { ObjectSelectTool } from "./tool/ObjectSelectTool";
import { RotationTool } from "./tool/RotationTool";
import { ScaleTool } from "./tool/ScaleTool";
import { SelectTool } from "./tool/SelectTool";
import { TranslateTool } from "./tool/TranslateTool";
import { WeightPaintTool } from "./tool/WeightPaintTool";
import { InsertKeyframeTool } from "./tool/InsertKeyframeTool";
import { ViewEditModes } from "../../../editor/editorState/ViewEditModes";
import type { ViewGeometrySource } from "./ViewGeometry";
import { ToolManager } from "./tool/ToolManager";

export class GizumoRenderData {
  public settingBuffer: GPUBuffer;
  public vertexSize: number;
  public boneSize: number;
  constructor() {
    /**
     * vertexSize: f32,
     * boneSize: f32,
     */
    this.settingBuffer = simpleWebGPU.createBuffer((1 + 1) * 4, ["U"]);

    this.vertexSize = 10;
    this.boneSize = 10;
  }
}

type ViewRenderDatas = View_SpriteRenderData | View_ArmatureRenderData;

export class UIComponent_View_SpaceData {
  public readonly toolManager = new ToolManager([
    new ObjectSelectTool(),
    new SelectTool(),
    new TranslateTool(),
    new RotationTool(),
    new ScaleTool(),
    new AddVertexTool(),
    new DeleteVertexTool(),
    new AddEdgeTool(),
    new GenerateSilhouetteTool(),
    new DeleteEdgeTool(),
    new AddBoneTool(),
    new DeleteBoneTool(),
    new WeightPaintTool(),
    new InsertKeyframeTool(),
  ]);
  public modeToToolMap: Record<ViewEditModes, string[]> = {
    [ViewEditModes.OBJECT]: ["objectSelect"],
    [ViewEditModes.VERTEX]: ["select", "translate", "rotation", "scale", "addVertex", "DeleteVertex", "AddEdge", "DeleteEdge", "GenerateSilhouette"],
    [ViewEditModes.WEIGHTPAINT]: ["select", "WeightPaint"],
    [ViewEditModes.BONE]: ["select", "translate", "rotation", "scale", "AddBone", "DeleteBone"],
    [ViewEditModes.BONEANIMATION]: ["select", "translate", "rotation", "scale", "InsertKeyframe"],
    [ViewEditModes.ERROR]: [],
  };
  public renderData: View_SpaceData_RenderData = new View_SpaceData_RenderData();
}

// Shared views keep both geometry sets alive until the last mounted consumer leaves.
export class View_SpaceData_RenderData extends SpaceData {
  private IDtoNumber: Map<ID, number> = new Map();
  private renderData: Map<ID, ViewRenderDatas> = new Map();
  private modelRenderData: Map<ID, ViewRenderDatas> = new Map();
  private consumers = new Set<object>();
  private gizumo: GizumoRenderData | null = null;
  public get gizumoRenderData(): GizumoRenderData { return this.gizumo ??= new GizumoRenderData(); }

  public acquire(consumer: object): void { this.consumers.add(consumer); }
  public release(consumer: object): void {
    if (this.consumers.delete(consumer) && !this.consumers.size) this.dispose();
  }

  private getFreeNumber(): number {
    const used = new Set(this.IDtoNumber.values());
    let id = 0;
    while (used.has(id)) {
      id++;
    }
    return id;
  }

  addSpriteRenderData(sprite: Runtime_Sprite): View_SpriteRenderData {
    const numberID = this.getFreeNumber();
    const spriteRenderData = new View_SpriteRenderData(numberID);
    this.renderData.set(sprite.id, spriteRenderData);
    this.modelRenderData.set(sprite.id, new View_SpriteRenderData(numberID));
    this.IDtoNumber.set(sprite.id, numberID);
    return spriteRenderData;
  }

  addArmatureRenderData(armature: Runtime_Armature): View_ArmatureRenderData {
    const numberID = this.getFreeNumber();
    const armatureRenderData = new View_ArmatureRenderData(numberID);
    this.renderData.set(armature.id, armatureRenderData);
    this.modelRenderData.set(armature.id, new View_ArmatureRenderData(numberID));
    this.IDtoNumber.set(armature.id, numberID);
    return armatureRenderData;
  }

  getRenderData(id: ID, source: ViewGeometrySource = "runtime"): ViewRenderDatas | null {
    return (source === "model" ? this.modelRenderData : this.renderData).get(id) ?? null;
  }

  public retain(ids: ReadonlySet<ID>): void {
    for (const [id, data] of this.renderData) if (!ids.has(id)) {
      data.dispose();
      this.modelRenderData.get(id)?.dispose();
      this.modelRenderData.delete(id);
      this.renderData.delete(id);
      this.IDtoNumber.delete(id);
    }
  }

  public dispose(): void {
    this.retain(new Set());
    this.gizumo?.settingBuffer.destroy();
    this.gizumo = null;
  }

  numberIDtoID(numberID: number): ID {
    for (const [id, nid] of this.IDtoNumber.entries()) {
      if (numberID === nid) return id;
    }
    return "";
  }
}

import { Runtime_Armature } from "../../../core/projectCache/runtime/Armature";
import { Runtime_Sprite } from "../../../core/projectCache/runtime/Sprite";
import { ID } from "../../../editor/Editor";
import { simpleWebGPU } from "../../../util/simpleWebGPU";
import { View_ArmatureRenderData } from "./renderData/ArmatureRenderData";
import { View_SpriteRenderData } from "./renderData/SpriteRenderData";
import { AddArmatureTool } from "./tool/AddArmatureTool";
import { AddBoneTool } from "./tool/AddBoneTool";
import { AddEdgeTool } from "./tool/AddEdgeTool";
import { AddVertexTool } from "./tool/AddVertexTool";
import { DeleteBoneTool } from "./tool/DeleteBoneTool";
import { DeleteEdgeTool } from "./tool/DeleteEdgeTool";
import { DeleteVertexTool } from "./tool/DeleteVertexTool";
import { ObjectSelectTool } from "./tool/ObjectSelectTool";
import { RotationTool } from "./tool/RotationTool";
import { ScaleTool } from "./tool/ScaleTool";
import { SelectTool } from "./tool/SelectTool";
import { Tool } from "./tool/Tool";
import { TranslateTool } from "./tool/TranslateTool";
import { WeightPaintTool } from "./tool/WeightPaintTool";
import { ViewEditModes } from "./ViewEditModes";

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
  public editMode: ViewEditModes = ViewEditModes.OBJECT;
  public currentTool = "objectSelect";
  public tools: Tool[] = [
    new ObjectSelectTool(),
    new SelectTool(),
    new TranslateTool(),
    new RotationTool(),
    new ScaleTool(),
    new AddVertexTool(),
    new DeleteVertexTool(),
    new AddEdgeTool(),
    new DeleteEdgeTool(),
    new AddBoneTool(),
    new DeleteBoneTool(),
    new AddArmatureTool(),
    new WeightPaintTool(),
  ];
  public modeToToolMap: Record<ViewEditModes, typeof Tool[]> = {
    [ViewEditModes.OBJECT]: [ObjectSelectTool, AddArmatureTool],
    [ViewEditModes.VERTEX]: [SelectTool, TranslateTool, RotationTool, ScaleTool, AddVertexTool, DeleteVertexTool, AddEdgeTool, DeleteEdgeTool],
    [ViewEditModes.WEIGHTPAINT]: [SelectTool, WeightPaintTool],
    [ViewEditModes.BONE]: [SelectTool, TranslateTool, RotationTool, ScaleTool, AddBoneTool, DeleteBoneTool],
    [ViewEditModes.BONEANIMATION]: [SelectTool, TranslateTool, RotationTool, ScaleTool],
    [ViewEditModes.ERROR]: [],
  };
  public renderData: View_SpaceData_RenderData = new View_SpaceData_RenderData();
}

// Per-panel GPU resources must not be destroyed by another panel sharing settings.
export class View_SpaceData_RenderData {
  private IDtoNumber: Map<ID, number> = new Map();
  private renderData: Map<ID, ViewRenderDatas> = new Map();
  public gizumoRenderData = new GizumoRenderData();

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
    this.IDtoNumber.set(sprite.id, numberID);
    return spriteRenderData;
  }

  addArmatureRenderData(armature: Runtime_Armature): View_ArmatureRenderData {
    const numberID = this.getFreeNumber();
    const armatureRenderData = new View_ArmatureRenderData(numberID);
    this.renderData.set(armature.id, armatureRenderData);
    this.IDtoNumber.set(armature.id, numberID);
    return armatureRenderData;
  }

  getRenderData(id: ID): ViewRenderDatas | null {
    return this.renderData.get(id) ?? null;
  }

  public retain(ids: ReadonlySet<ID>): void {
    for (const [id, data] of this.renderData) if (!ids.has(id)) {
      data.dispose();
      this.renderData.delete(id);
      this.IDtoNumber.delete(id);
    }
  }

  public dispose(): void {
    this.retain(new Set());
    this.gizumoRenderData.settingBuffer.destroy();
  }

  numberIDtoID(numberID: number): ID {
    for (const [id, nid] of this.IDtoNumber.entries()) {
      if (numberID === nid) return id;
    }
    return "";
  }
}

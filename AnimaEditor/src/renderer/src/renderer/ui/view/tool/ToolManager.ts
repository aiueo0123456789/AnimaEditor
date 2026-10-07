import type { AnimaEditor } from "../../../../editor/Editor";
import { InputManager } from "../../../../manager/InputManager";
import { bind, Button, Column, Header, Main, Text, type Widget } from "../../../../manager/ui/components";
import type { UIComponent_View } from "../View";
import type { Tool } from "./Tool";

export interface ToolInputContext {
  editor: AnimaEditor;
  view: UIComponent_View;
}

export interface ToolRenderContext extends ToolInputContext {
  renderPass: GPURenderPassEncoder;
}

export class ToolManager {
  private readonly toolMap = new Map<string, Tool>();
  private inputOwner: UIComponent_View | null = null;
  private mode = "";
  public activeToolID = "objectSelect";
  public version = 0;

  constructor(tools: readonly Tool[]) {
    for (const tool of tools) {
      if (!tool.id || this.toolMap.has(tool.id)) throw new Error(`Tool ID is invalid or duplicated: ${tool.id}`);
      this.toolMap.set(tool.id, tool);
    }
  }

  public get tools(): readonly Tool[] { return [...this.toolMap.values()]; }
  public get activeTool(): Tool | null { return this.toolMap.get(this.activeToolID) ?? null; }
  public getTool(id: string): Tool | null { return this.toolMap.get(id) ?? null; }
  public available(ids: readonly string[]): Tool[] {
    return ids.map(id => this.toolMap.get(id)).filter((tool): tool is Tool => !!tool);
  }

  public activate(id: string): boolean {
    const next = this.toolMap.get(id);
    if (!next) return false;
    if (this.activeTool === next) return true;
    this.activeTool?.deactivate();
    this.inputOwner = null;
    this.activeToolID = id;
    next.activate();
    this.version++;
    return true;
  }

  public ensureActive(availableIDs: readonly string[]): void {
    if (availableIDs.includes(this.activeToolID)) return;
    const next = availableIDs.find(id => this.toolMap.has(id));
    if (next) this.activate(next);
    else {
      this.activeTool?.deactivate();
      this.inputOwner = null;
      this.activeToolID = "";
      this.version++;
    }
  }

  public syncMode(mode: string, availableIDs: readonly string[]): void {
    if (this.mode !== mode) {
      this.cancelInput();
      this.mode = mode;
      this.version++;
    }
    this.ensureActive(availableIDs);
  }

  public update(context: ToolInputContext): void {
    const input = context.editor.getManager(InputManager);
    if (!input) return;
    if (input.getKeyDown("Mouse0")) {
      if (this.inputOwner && this.inputOwner !== context.view) return;
      this.inputOwner = context.view;
    }
    if (this.inputOwner && this.inputOwner !== context.view) return;
    this.activeTool?.update(context.editor, context.view);
    if (this.inputOwner === context.view && (input.getKeyUp("Mouse0") || !input.getKey("Mouse0"))) this.inputOwner = null;
  }

  public drawOverlay(context: ToolRenderContext): void {
    this.activeTool?.drawOverlay(context.editor, context.view, context.renderPass);
  }

  public cancelInput(view?: UIComponent_View): void {
    if (view && this.inputOwner && this.inputOwner !== view) return;
    this.activeTool?.deactivate();
    this.inputOwner = null;
  }

  public releaseView(view: UIComponent_View): void {
    if (this.inputOwner === view) this.cancelInput(view);
  }

  public createToolbarWidget(availableIDs: readonly string[]): Widget {
    return Column({ gap: 3, children: this.available(availableIDs).map(tool => Button({
      label: tool.label,
      tooltip: tool.label,
      icon: tool.icon,
      iconOnly: true,
      pressed: bind({ read: () => this.activeToolID === tool.id }),
      onPress: () => { this.activate(tool.id); },
    })) });
  }

  public createParamsWidget(editor: AnimaEditor): Widget | null {
    const tool = this.activeTool;
    const params = tool?.createParamsWidget(editor) ?? null;
    if (!tool || !params) return null;
    return Column({ className: "ui-tool-params-panel", children: [
      Header({ className: "ui-tool-params-header", children: [Text({ text: tool.label })] }),
      Main({ className: "ui-tool-params-main", padding: 8, overflow: "auto", children: [params] }),
    ] });
  }
}

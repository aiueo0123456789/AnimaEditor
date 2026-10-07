import { AnimaEditor } from "../../editor/Editor";
import { JTag } from "../../library/JTag/JTag";
import { bind, Button, Column, Container, ContextMenu, Header, Select, Split, Submenu } from "./components";
import { UIComponent_Preview } from "../../renderer/ui/preview/Preview";
import { UIComponent_Inspector } from "../../renderer/ui/Inspector/Inspector";
import { UIComponent_Project } from "../../renderer/ui/Project/Project";
import { UIComponent_Timeline } from "../../renderer/ui/Timeline/Timeline";
import { UIComponent_View } from "../../renderer/ui/view/View";
import { SourceContext } from "../context/contexts/SourceContext";
import { EditorEvent, EventManager } from "../EventManager";
import { InputManager } from "../InputManager";
import { Manager } from "../Manager";
import { WidgetTree } from "./WidgetTree";
import { DOMRenderer } from "./DOMRenderer";
import type { WidgetHandle } from "./WidgetTree";
import type { Widget, WidgetChild } from "./components";
import type { ContextMenuWidget } from "./components";
import { UIComponent_View_SpaceData } from "../../renderer/ui/view/SpaceData";
import { UIComponent_Preview_SpaceData } from "../../renderer/ui/preview/SpaceData";
import { UIComponent_Project_SpaceData } from "../../renderer/ui/Project/SpaceData";
import { UIComponent_Inspector_SpaceData } from "../../renderer/ui/Inspector/SpaceData";
import { UIComponent_Timeline_SpaceData } from "../../renderer/ui/Timeline/SpaceData";
import { SpaceData } from "../../renderer/ui/UI";

type UIComponents = UIComponent_View | UIComponent_Inspector | UIComponent_Project | UIComponent_Timeline | UIComponent_Preview;
type UIComponentName = "View" | "Preview" | "Inspector" | "Project" | "Timeline";

const UI_COMPONENT_OPTIONS: readonly { value: UIComponentName; label: string }[] = [
  { value: "View", label: "View" },
  { value: "Preview", label: "Preview" },
  { value: "Inspector", label: "Inspector" },
  { value: "Project", label: "Project" },
  { value: "Timeline", label: "Timeline" },
];

interface LayoutPanelNode {
  readonly kind: "panel";
  readonly id: string;
  component: UIComponents;
}

interface LayoutSplitNode {
  readonly kind: "split";
  readonly id: string;
  readonly direction: "horizontal" | "vertical";
  readonly label: string;
  ratio: number;
  first: LayoutNode;
  second: LayoutNode;
}

type LayoutNode = LayoutPanelNode | LayoutSplitNode;

export class UIManager extends Manager {
  private readonly spaces = new Map<new () => object, SpaceData>();

  public getSpaceData<T extends object>(type: new () => T): T {
    let space = this.spaces.get(type);
    if (!space) this.spaces.set(type, space = new type());
    return space as T;
  }
  private readonly widgetTree = new WidgetTree(new DOMRenderer({ createIcon: name => {
    const source = JTag.getSvg(name);
    if (!source) return null;
    return new DOMParser().parseFromString(source, "image/svg+xml").documentElement as unknown as SVGElement;
  } }));

  public mountWidget(parent: HTMLElement, widget: WidgetChild): WidgetHandle {
    return this.widgetTree.mount(parent, widget);
  }

  public resetWidget(handle: WidgetHandle, widget?: WidgetChild): void {
    this.widgetTree.reset(handle, widget);
  }

  public invalidateWidget(handle: WidgetHandle): void {
    this.widgetTree.invalidate(handle);
  }

  public disposeWidget(handle: WidgetHandle): void {
    this.widgetTree.dispose(handle);
  }

  public disposeWidgets(): void {
    this.widgetTree.disposeAll();
  }

  private uiComponents: UIComponents[];
  private readonly externalComponents = new Set<UIComponents>();
  // private event: Map<>;


  private uiContainer: Map<UIComponents, HTMLElement>;
  private layoutRoot: LayoutNode;
  private nextLayoutID = 0;
  private changeLayout: boolean;

  public mountPanel(parent: HTMLElement, component: UIComponents): WidgetHandle {
    if (this.uiContainer.has(component)) throw new Error("A UI instance can only be mounted once");
    this.externalComponents.add(component);
    this.syncComponents();
    let current = component;
    let handle: WidgetHandle;
    const replace = (name: UIComponentName): void => {
      if (current.name === name) return;
      const next = this.createComponent(name);
      current.dispose?.(this.editor);
      this.uiContainer.delete(current);
      this.externalComponents.delete(current);
      this.externalComponents.add(next);
      current = next;
      this.syncComponents();
      this.resetWidget(handle, this.panelWidget(current, replace, true));
    };
    handle = this.mountWidget(parent, this.panelWidget(current, replace, true));
    return handle;
  }

  private panelWidget(component: UIComponents, onChange: (name: UIComponentName) => void, removeOnUnmount = false): Widget {
    return Column({
      className: "ui-panel-host",
      contextMenu: this.findPanelNode(component) ? () => this.panelContextMenu(component) : undefined,
      children: [
      Header({ className: "ui-panel-switcher", children: [Select({
        className: "ui-panel-type-select",
        label: "UI",
        value: bind({ read: () => component.name }),
        options: UI_COMPONENT_OPTIONS,
        onChange: value => { if (value) onChange(value as UIComponentName); },
      })] }),
      Container({
        className: "ui-panel-content", grow: 1, overflow: "hidden",
        onMount: element => {
          element.dataset.panel = component.name;
          this.uiContainer.set(component, element);
          return () => {
            component.dispose?.(this.editor);
            this.uiContainer.delete(component);
            if (removeOnUnmount) {
              this.externalComponents.delete(component);
              this.syncComponents();
            }
          };
        },
      }),
    ] });
  }

  private createComponent(name: UIComponentName): UIComponents {
    switch (name) {
      case "View": return new UIComponent_View(this.getSpaceData(UIComponent_View_SpaceData));
      case "Preview": return new UIComponent_Preview(this.getSpaceData(UIComponent_Preview_SpaceData));
      case "Inspector": return new UIComponent_Inspector(this.getSpaceData(UIComponent_Inspector_SpaceData));
      case "Project": return new UIComponent_Project(this.getSpaceData(UIComponent_Project_SpaceData));
      case "Timeline": return new UIComponent_Timeline(this.getSpaceData(UIComponent_Timeline_SpaceData));
    }
  }

  private createPanelNode(name: UIComponentName): LayoutPanelNode {
    return { kind: "panel", id: `panel-${this.nextLayoutID++}`, component: this.createComponent(name) };
  }

  private createSplitNode(direction: "horizontal" | "vertical", first: LayoutNode, second: LayoutNode,
      ratio = .5, label = "画面分割"): LayoutSplitNode {
    return { kind: "split", id: `split-${this.nextLayoutID++}`, direction, first, second, ratio, label };
  }

  private collectComponents(node: LayoutNode, output: UIComponents[] = []): UIComponents[] {
    if (node.kind === "panel") output.push(node.component);
    else {
      this.collectComponents(node.first, output);
      this.collectComponents(node.second, output);
    }
    return output;
  }

  private syncComponents(): void {
    this.uiComponents = [...this.collectComponents(this.layoutRoot), ...this.externalComponents];
  }

  private replaceNode(target: LayoutNode, replacement: LayoutNode): boolean {
    if (this.layoutRoot === target) {
      this.layoutRoot = replacement;
      return true;
    }
    const visit = (node: LayoutNode): boolean => {
      if (node.kind === "panel") return false;
      if (node.first === target) { node.first = replacement; return true; }
      if (node.second === target) { node.second = replacement; return true; }
      return visit(node.first) || visit(node.second);
    };
    return visit(this.layoutRoot);
  }

  private findPanelNode(component: UIComponents, node: LayoutNode = this.layoutRoot): LayoutPanelNode | null {
    if (node.kind === "panel") return node.component === component ? node : null;
    return this.findPanelNode(component, node.first) ?? this.findPanelNode(component, node.second);
  }

  private replaceLayoutComponent(node: LayoutPanelNode, name: UIComponentName): void {
    const current = node.component;
    if (current.name === name) return;
    current.dispose?.(this.editor);
    this.uiContainer.delete(current);
    node.component = this.createComponent(name);
    this.syncComponents();
    this.changeLayout = true;
  }

  private splitPanel(node: LayoutPanelNode, direction: "horizontal" | "vertical"): void {
    const duplicate = this.createPanelNode(node.component.name as UIComponentName);
    if (!this.replaceNode(node, this.createSplitNode(direction, node, duplicate))) return;
    this.syncComponents();
    this.changeLayout = true;
  }

  private mergeSplit(node: LayoutSplitNode, keep: "first" | "second"): void {
    const kept = node[keep];
    const removed = node[keep === "first" ? "second" : "first"];
    if (!this.replaceNode(node, kept)) return;
    for (const component of this.collectComponents(removed)) {
      component.dispose?.(this.editor);
      this.uiContainer.delete(component);
    }
    this.syncComponents();
    this.changeLayout = true;
  }

  public panelContextMenu(component: UIComponents, children: readonly WidgetChild[] = []): ContextMenuWidget {
    const panel = this.findPanelNode(component);
    return ContextMenu({ children: [...children, ...(panel ? [Submenu({
      label: "画面の分割",
      children: [
        Button({ label: "水平に分割", onPress: () => this.splitPanel(panel, "horizontal") }),
        Button({ label: "垂直に分割", onPress: () => this.splitPanel(panel, "vertical") }),
      ],
    })] : [])] });
  }

  private layoutWidget(node: LayoutNode): Widget {
    if (node.kind === "panel") return this.panelWidget(node.component,
      name => this.replaceLayoutComponent(node, name));
    return Split({
      key: node.id,
      direction: node.direction,
      ratio: node.ratio,
      first: this.layoutWidget(node.first),
      second: this.layoutWidget(node.second),
      label: node.label,
      minFirst: 60,
      minSecond: 60,
      onRatioChange: value => { node.ratio = value; },
      resizerContextMenu: () => ContextMenu({ children: [
        Submenu({
          label: "画面の統合",
          children: [
            Button({ label: node.direction　=== "vertical" ? "上に統合" : "左に統合", onPress: () => this.mergeSplit(node, "first") }),
            Button({ label: node.direction　=== "vertical" ? "下に統合" : "右に統合", onPress: () => this.mergeSplit(node, "second") }),
          ]})
      ] }),
    });
  }

  constructor(editor: AnimaEditor) {
    super(editor);

    const view = this.createPanelNode("View");
    const preview = this.createPanelNode("Preview");
    const inspector = this.createPanelNode("Inspector");
    const project = this.createPanelNode("Project");
    const timeline = this.createPanelNode("Timeline");
    this.layoutRoot = this.createSplitNode("horizontal",
      this.createSplitNode("vertical",
        this.createSplitNode("horizontal", view, preview, .65, "Preview width"),
        timeline, .72, "Timeline height"),
      this.createSplitNode("vertical", project, inspector, .4, "Inspector height"),
      .76, "Workspace");
    this.uiComponents = [];
    this.syncComponents();

    this.uiContainer = new Map();

    this.changeLayout = true;
  }

  private submitEvent(event: EditorEvent): void {
    function equalEvent(sourceEvent: EditorEvent, targetEvents: readonly EditorEvent[]) {
      for (const targetEvent of targetEvents) {
        const equalSource = targetEvent.source instanceof SourceContext ? targetEvent.source.resolve() === sourceEvent.source : targetEvent.source === sourceEvent.source;
        const equalPath = targetEvent.path === sourceEvent.path || targetEvent.path === "" ||
          sourceEvent.path.startsWith(`${targetEvent.path}.`);
        if (
          targetEvent.type === sourceEvent.type &&
          equalSource &&
          equalPath
        ) {
          return true;
        }
      }
      return false;
    }
    this.widgetTree.submitEvent(event, equalEvent);
  }

  private updateLayout(): void {
    this.disposeWidgets();
    for (const ui of this.uiComponents) ui.dispose?.(this.editor);
    this.uiContainer.clear();
    this.mountWidget(document.body, Container({ className: "ui-editor-layout", overflow: "auto", child:
      this.layoutWidget(this.layoutRoot)
    }));
    this.changeLayout = false;
  }

  public override update(): void {
    for (const ui of this.uiComponents) {
      const parent = this.uiContainer.get(ui);
      if (parent && parent.matches(":hover")) {
        ui._input(this.editor);
      }
    }
  }

  public override updateLate(): void {
    const inputManager = this.editor.getManager(InputManager);
    if (!inputManager) return ;

    const eventManager = this.editor.getManager(EventManager);
    if (!eventManager) return ;

    if (inputManager.getKey("MetaLeft") && inputManager.getKeyDown("KeyS")) {
      this.editor.save();
    }
    if (this.changeLayout) {
      this.updateLayout();
    }
    for (const ui of this.uiComponents) {
      const parent = this.uiContainer.get(ui);
      if (parent) {
        ui.update(this.editor, parent);
      }
    }

    for (const event of eventManager.takeEvents()) {
      this.submitEvent(event);
    }
    this.widgetTree.flush();
  }
}

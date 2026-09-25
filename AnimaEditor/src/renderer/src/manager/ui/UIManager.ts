import { AnimaEditor } from "../../editor/Editor";
import { JTag } from "../../library/JTag/JTag";
import { Container, Split } from "./components";
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
import { UIComponent_View_SpaceData } from "../../renderer/ui/view/SpaceData";
import { UIComponent_Preview_SpaceData } from "../../renderer/ui/preview/SpaceData";
import { UIComponent_Project_SpaceData } from "../../renderer/ui/Project/SpaceData";
import { UIComponent_Inspector_SpaceData } from "../../renderer/ui/Inspector/SpaceData";
import { UIComponent_Timeline_SpaceData } from "../../renderer/ui/Timeline/SpaceData";

type UIComponents = UIComponent_View | UIComponent_Inspector | UIComponent_Project | UIComponent_Timeline | UIComponent_Preview;

export class UIManager extends Manager {
  private readonly spaces = new Map<new () => object, object>();

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
  // private event: Map<>;


  private uiContainer: Map<UIComponents, HTMLElement>;
  private readonly ratios = new Map<string, number>();
  private changeLayout: boolean;

  public mountPanel(parent: HTMLElement, component: UIComponents): WidgetHandle {
    if (this.uiContainer.has(component)) throw new Error("A UI instance can only be mounted once");
    return this.mountWidget(parent, this.panelWidget(component));
  }

  private panelWidget(component: UIComponents): Widget {
    return Container({
      className: "ui-panel-host", overflow: "hidden",
      onMount: element => {
        const added = !this.uiComponents.includes(component);
        if (added) this.uiComponents.push(component);
        element.dataset.panel = component.name;
        this.uiContainer.set(component, element);
        return () => {
          component.dispose?.(this.editor);
          this.uiContainer.delete(component);
          if (added) this.uiComponents = this.uiComponents.filter(item => item !== component);
        };
      },
    });
  }

  constructor(editor: AnimaEditor) {
    super(editor);

    this.uiComponents = [
      new UIComponent_View(this.getSpaceData(UIComponent_View_SpaceData)),
      new UIComponent_Preview(this.getSpaceData(UIComponent_Preview_SpaceData)),
      new UIComponent_Inspector(this.getSpaceData(UIComponent_Inspector_SpaceData)),
      new UIComponent_Project(this.getSpaceData(UIComponent_Project_SpaceData)),
      new UIComponent_Timeline(this.getSpaceData(UIComponent_Timeline_SpaceData)),
    ];


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
    const panel = (name: string): Widget => this.panelWidget(this.uiComponents.find(ui => ui.name === name)!);
    const split = (key: string, direction: "horizontal" | "vertical", ratio: number, first: Widget, second: Widget): Widget =>
      Split({ key, direction, ratio: this.ratios.get(key) ?? ratio, first, second,
        label: key, minFirst: 60, minSecond: 60,
        onRatioChange: value => this.ratios.set(key, value) });
    this.mountWidget(document.body, Container({ className: "ui-editor-layout", overflow: "auto", child:
      split("Workspace", "horizontal", 0.76,
        split("Timeline height", "vertical", 0.72,
          split("Preview width", "horizontal", 0.65, panel("View"), panel("Preview")),
          panel("Timeline")),
        split("Inspector height", "vertical", 0.4, panel("Project"), panel("Inspector")))
    }));
    this.changeLayout = false;
  }

  public override update(): void {
    for (const ui of this.uiComponents) {
      const parent = this.uiContainer.get(ui);
      if (typeof ui.input === "function") {
        if (parent && parent.matches(":hover")) {
          ui.input(this.editor);
        }
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

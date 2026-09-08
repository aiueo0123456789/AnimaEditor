import { AnimaEditor } from "../editor/Editor";
import { JTag } from "../library/JTag/JTag";
import { JTag_Column } from "../library/JTag/tag/Column";
import { JTag_Container } from "../library/JTag/tag/Container";
import { EventListenerData, JTag_CustomTag } from "../library/JTag/tag/CustomTag";
import { JTag_Row } from "../library/JTag/tag/Row";
import { UIComponent_Inspector } from "../renderer/ui/Inspector/Inspector";
import { UIComponent_Project } from "../renderer/ui/Project/Project";
import { UIComponent_Timeline } from "../renderer/ui/Timeline/Timeline";
import { UIComponent_View } from "../renderer/ui/view/View";
import { UIComponent_WeightGroup } from "../renderer/ui/WeightGroup/WeightGroup";
import { CommandManager } from "./CommandManager";
import { SourceContext } from "./context/SourceContext";
import { EditorEvent, EventManager } from "./EventManager";
import { InputManager } from "./InputManager";
import { Manager } from "./Manager";

type UIComponents = UIComponent_View | UIComponent_Inspector | UIComponent_Project | UIComponent_Timeline | UIComponent_WeightGroup;

type Resolved<T> = T extends SourceContext ? ReturnType<T["resolve"]> : T;

type ResolveMap<T extends Record<string, unknown>> = {
  [K in keyof T]: Resolved<T[K]>;
};

export type UpdaterAndInputerInput<
  TTagMap extends Record<string, unknown>,
  TInputMap extends Record<string, unknown>
> = {
  tagMap: TTagMap;
  inputMap: TInputMap;
};

export type TagUpdaterUpdateFunction<
  TTagMap extends Record<string, unknown>,
  TInputMap extends Record<string, unknown>
> = (
  input: UpdaterAndInputerInput<TTagMap, TInputMap>
) => void;

export interface TagUpdaterInput<
  TTagMap extends Record<string, JTag_CustomTag>,
  TInputMap extends Record<string, unknown>
> {
  targetEvents: EditorEvent[];
  tagMap: TTagMap;
  inputMap: TInputMap;
  update: TagUpdaterUpdateFunction<TTagMap, ResolveMap<TInputMap>>;
}

export class TagUpdater<
  TTagMap extends Record<string, JTag_CustomTag>,
  TInputMap extends Record<string, unknown>
> {
  public targetEvents: EditorEvent[];
  public tagMap: TTagMap;
  public inputMap: TInputMap;
  public update: TagUpdaterUpdateFunction<TTagMap, ResolveMap<TInputMap>>;

  constructor(data: TagUpdaterInput<TTagMap, TInputMap>) {
    this.targetEvents = data.targetEvents;
    this.tagMap = data.tagMap;
    this.inputMap = data.inputMap;
    this.update = data.update;
  }
}


export type InputerActionFunction<
  TTagMap extends Record<string, unknown>,
  TInputMap extends Record<string, unknown>
> = (
  commandManager: CommandManager,
  input: UpdaterAndInputerInput<TTagMap, TInputMap>
) => EventListenerData[];

export interface InputerInput<
  TTagMap extends Record<string, JTag_CustomTag>,
  TInputMap extends Record<string, unknown>
> {
  targetEvents: EditorEvent[];
  tagMap: TTagMap;
  inputMap: TInputMap;
  action: InputerActionFunction<TTagMap, ResolveMap<TInputMap>>;
}

export class Inputer<
  TTagMap extends Record<string, JTag_CustomTag>,
  TInputMap extends Record<string, unknown>
> {
  public targetEvents: EditorEvent[];
  public tagMap: TTagMap;
  public inputMap: TInputMap;
  public action: InputerActionFunction<TTagMap, ResolveMap<TInputMap>>;
  public _lastEventListenerDatas: EventListenerData[];

  constructor(data: InputerInput<TTagMap, TInputMap>) {
    this.targetEvents = data.targetEvents;
    this.tagMap = data.tagMap;
    this.inputMap = data.inputMap;
    this.action = data.action;
    this._lastEventListenerDatas = [];
  }
}

export class UIManager extends Manager {
  static createTagUpdater<
    TTagMap extends Record<string, JTag_CustomTag>,
    TInputMap extends Record<string, unknown>
  >(
    data: TagUpdaterInput<TTagMap, TInputMap>
  ): TagUpdater<TTagMap, TInputMap> {
    return new TagUpdater(data);
  }

  static createInputer<
    TTagMap extends Record<string, JTag_CustomTag>,
    TInputMap extends Record<string, unknown>
  >(
    data: InputerInput<TTagMap, TInputMap>
  ): Inputer<TTagMap, TInputMap> {
    return new Inputer(data);
  }

  private uiComponents: UIComponents[];
  // private event: Map<>;

  private updaters: TagUpdater<any, any>[];
  private inputers: Inputer<any, any>[];

  private uiContainer: Map<string, JTag_Container>;
  private layout: Record<string, unknown>;
  private changeLayout: boolean;

  constructor(editor: AnimaEditor) {
    super(editor);

    this.uiComponents = [
      new UIComponent_View(),
      new UIComponent_Inspector(),
      new UIComponent_Project(),
      new UIComponent_Timeline(),
      // new UIComponent_WeightGroup(),
    ];

    this.updaters = [];
    this.inputers = [];

    this.uiContainer = new Map();
    this.layout = {
      column: true,
      children: [
        {
          row: true,
          children: [
            {
              ui: true,
              type: "View",
            },
            {
              ui: true,
              type: "Timeline",
            },
          ],
        },
        {
          row: true,
          children: [
            {
              ui: true,
              type: "Project",
            },
            {
              ui: true,
              type: "Inspector",
            },
          ],
        },
      ],
    };

    this.changeLayout = true;
  }

  public addTagUpdater(tagUpdater: TagUpdater<any, any>) {
    this.updaters.push(tagUpdater);
  }

  public addInputer(inputer: Inputer<any, any>) {
    this.inputers.push(inputer);
  }

  private submitEvent(event: EditorEvent): void {
    function equalEvent(sourceEvent: EditorEvent, targetEvents: EditorEvent[]) {
      for (const targetEvent of targetEvents) {
        const equalSource = targetEvent.source instanceof SourceContext ? targetEvent.source.resolve() === sourceEvent.source : targetEvent.source === sourceEvent.source;
        const equalPath = targetEvent.path === sourceEvent.path || targetEvent.path === ""; // pathが未指定の場合全てのsourceの変更を対象
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
    for (const updater of this.updaters) {
      if (equalEvent(event, updater.targetEvents)) {
        const inputMap = {};
        for (const key in updater.inputMap) {
          const value = updater.inputMap[key];
          if (value instanceof SourceContext) inputMap[key] = value.resolve();
          else inputMap[key] = value;
        }
        updater.update({tagMap: updater.tagMap, inputMap: inputMap});
      }
    }

    const commandManager = this.editor.getManager(CommandManager) as CommandManager;
    for (const inputer of this.inputers) {
      if (equalEvent(event, inputer.targetEvents)) {
        console.log(inputer)
        for (const eventListenerData of inputer._lastEventListenerDatas) {
          eventListenerData.target.removeEventListener(eventListenerData.event, eventListenerData.listener);
        }
        const inputMap = {};
        for (const key in inputer.inputMap) {
          const value = inputer.inputMap[key];
          if (value instanceof SourceContext) inputMap[key] = value.resolve();
          else inputMap[key] = value;
        }
        inputer._lastEventListenerDatas = inputer.action(commandManager, {tagMap: inputer.tagMap, inputMap: inputMap});
      }
    }
  }

  private updateLayout(): void {
    this.uiContainer.clear();
    const _loop = (parent, struct, insertIndex = 0) => {
      let tag: JTag_Row | JTag_Column | JTag_Container = JTag.createTag(JTag_Row);
      if (struct.row) { // デフォルトがrow
        // tag = JTag.createTag(JTag_Row);
      } else if (struct.column) {
        tag = JTag.createTag(JTag_Column);
      } else if (struct.ui) {
        tag = JTag.createTag(JTag_Container);
        this.uiContainer.set(struct.type, tag);
        tag.body.addEventListener("mouseenter", () => {
          tag.customData.active = true;
        });
        tag.body.addEventListener("mouseleave", () => {
          tag.customData.active = false;
        });
      }
      if (tag) {
        this.editor.library.JTag.append(parent, tag, insertIndex);
        for (
          let childIndex = 0;
          childIndex < struct.children?.length;
          childIndex++
        ) {
          _loop(tag, struct.children[childIndex], childIndex);
        }
      } else {
        console.warn("許可されていない文字が含まれている可能性があります")
      }
    };
    _loop(null, this.layout);
    this.changeLayout = false;
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
      const parent = this.uiContainer.get(ui.name);
      if (parent) {
        if (parent.customData.active) {
          if (ui?.input) ui.input(inputManager, this.editor);
        }
        ui.update(this.editor, parent);
      }
    }

    for (const event of eventManager.events) {
      this.submitEvent(event);
    }
  }
}

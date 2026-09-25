import type { AnimaEditor } from "../../../editor/Editor";
import { Model_Sprite } from "../../../core/project/model/Sprite";
import { Model_Armature } from "../../../core/project/model/Armature";
import { Model_Animation } from "../../../core/project/model/Animation";
import { Model_Texture } from "../../../core/project/model/Texture";
import { CommandManager } from "../../../manager/CommandManager";
import { EditorEvent, EditorEventType } from "../../../manager/EventManager";
import { UIManager } from "../../../manager/ui/UIManager";
import type { WidgetHandle } from "../../../manager/ui/WidgetTree";
import { bind, Button, Column, Row, Header, Main, Hierarchy, Text, TextField } from "../../../manager/ui/components";
import type { Widget } from "../../../manager/ui/components";
import { commitUIProperty } from "../../../manager/ui/commands";
import { UIComponent } from "../UI";
import { UIComponent_Project_SpaceData } from "./SpaceData";

export class UIComponent_Project extends UIComponent {
  private handle: WidgetHandle | null = null;
  private host: HTMLElement | null = null;
  private renderedQuery = "";
  private get query(): string { return this.spaceData.query; }
  private set query(value: string) { this.spaceData.query = value; }

  constructor(public readonly spaceData = new UIComponent_Project_SpaceData()) { super({ name: "Project", id: 0, icon: "hierarchy" }); }
  public override input(): void {}

  public override dispose(editor: AnimaEditor): void {
    if (this.handle) editor.getManager(UIManager)?.disposeWidget(this.handle);
    this.handle = null;
    this.host = null;
  }

  public override update(editor: AnimaEditor, parent: HTMLElement): void {
    if (this.host === parent && this.handle && this.renderedQuery === this.query) return;
    this.dispose(editor);
    const ui = editor.getManager(UIManager);
    const commands = editor.getManager(CommandManager);
    if (!ui || !commands) return;
    const change = (source: unknown, path: string) => new EditorEvent(EditorEventType.change, source, path);
    const build = (): Widget => {
      const groups = [
        { title: "sprite", models: editor.project.getModelsByType(Model_Sprite) },
        { title: "armature", models: editor.project.getModelsByType(Model_Armature) },
        { title: "animation", models: editor.project.getModelsByType(Model_Animation) },
        { title: "texture", models: editor.project.getModelsByType(Model_Texture) },
      ];
      return Column({
        className: "ui-panel", rebuild: build,
        observeEvents: [
          change(editor, "project"),
          new EditorEvent(EditorEventType.add, editor.project, "models"),
          new EditorEvent(EditorEventType.delete, editor.project, "models"),
        ],
        children: [
          Header({ direction: "column", gap: 8, children: [
            Row({ justify: "space-between", children: [
              Text({ text: "Project" }),
              TextField({
                label: "検索", value: this.query, onChange: () => {},
                onCommit: value => {
                  if (value === this.query) return;
                  this.query = value;
                  this.renderedQuery = value;
                  if (this.handle) ui.resetWidget(this.handle, build());
                },
              }),
              Button({ label: "開く", onPress: () => editor.load() }),
            ] }),
          ] }),
          Main({ padding: 0, overflow: "hidden", children: [Hierarchy({
            label: "Project", filter: this.query,
            items: bind({
              observeEvents: groups.flatMap(group => group.models.map(model => change(model, "name"))),
              read: () => [
                { id: "group:models", label: "models", selectable: false, children: groups.map(group => ({
                  id: "group:" + group.title, label: group.title, selectable: false,
                  children: group.models.map(model => ({ id: model.id, label: model.name, renamable: true })),
                })) },
                { id: "group:runtimes", label: "runtimes", selectable: false, children: [] },
              ],
            }),
            selected: bind({
              observeEvents: [change(editor.editorState, "activeObject")],
              read: () => editor.editorState.activeObject?.id ?? null,
            }),
            onSelect: id => {
              const model = groups.flatMap(group => [...group.models]).find(model => model.id === id);
              if (model) commitUIProperty(commands, editor.editorState, "activeObject", model);
            },
            onRename: (id, name) => {
              const model = groups.flatMap(group => [...group.models]).find(model => model.id === id);
              if (model && model.name !== name) commitUIProperty(commands, model, "name", name);
            },
          })] }),
        ],
      });
    };
    this.handle = ui.mountWidget(parent, build());
    this.host = parent;
    this.renderedQuery = this.query;
  }
}

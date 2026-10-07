import type { AnimaEditor } from "../../../editor/Editor";
import { Model_Sprite } from "../../../core/project/model/Sprite";
import { Model_Armature } from "../../../core/project/model/Armature";
import { Model_Animation } from "../../../core/project/model/Animation";
import { Model_Texture } from "../../../core/project/model/Texture";
import { CommandManager } from "../../../manager/CommandManager";
import { EditorEvent, EditorEventType } from "../../../manager/EventManager";
import { UIManager } from "../../../manager/ui/UIManager";
import type { WidgetHandle } from "../../../manager/ui/WidgetTree";
import { bind, Button, Checkbox, Column, Row, Header, Main, Hierarchy, List, Modal, Text, TextField } from "../../../manager/ui/components";
import type { Widget } from "../../../manager/ui/components";
import { commitUISelection, commitUIProperty } from "../../../manager/ui/commands";
import { UIComponent } from "../UI";
import { UIComponent_Project_SpaceData } from "./SpaceData";
import { appendProjectModels, selectAppendSource, type AppendSource } from "../../../editor/serialization/Append";

export class UIComponent_Project extends UIComponent {
  private handle: WidgetHandle | null = null;
  private appendModalHandle: WidgetHandle | null = null;
  private host: HTMLElement | null = null;
  private renderedQuery = "";
  private get query(): string { return this.spaceData.query; }
  private set query(value: string) { this.spaceData.query = value; }

  constructor(public readonly spaceData = new UIComponent_Project_SpaceData()) { super({ name: "Project", id: 0, icon: "hierarchy" }); }
  public override input(): void {}

  public override dispose(editor: AnimaEditor): void {
    const ui = editor.getManager(UIManager);
    if (this.handle) ui?.disposeWidget(this.handle);
    if (this.appendModalHandle) ui?.disposeWidget(this.appendModalHandle);
    this.handle = null;
    this.appendModalHandle = null;
    this.host = null;
  }

  private closeAppend(ui: UIManager): void {
    if (this.appendModalHandle) ui.disposeWidget(this.appendModalHandle);
    this.appendModalHandle = null;
  }

  private showAppendError(ui: UIManager, message: string): void {
    this.closeAppend(ui);
    const close = () => this.closeAppend(ui);
    this.appendModalHandle = ui.mountWidget(document.body, Modal({
      title: "アペンドできませんでした",
      onClose: close,
      children: [
        Text({ text: message, selectable: true }),
        Row({ className: "ui-modal-actions", justify: "end", children: [Button({ label: "閉じる", onPress: close })] }),
      ],
    }));
  }

  private showAppendModels(editor: AnimaEditor, ui: UIManager, source: AppendSource): void {
    this.closeAppend(ui);
    const selected = new Set(source.models.map((_, index) => index));
    const close = () => this.closeAppend(ui);
    const rebuild = (): void => {
      if (this.appendModalHandle) ui.resetWidget(this.appendModalHandle, build());
    };
    const build = (): Widget => Modal({
      title: "モデルをアペンド",
      onClose: close,
      children: [
        Text({ text: `読み込み元: ${source.projectName}` }),
        Row({ gap: 6, children: [
          Button({ label: "全選択", disabled: selected.size === source.models.length, onPress: () => {
            source.models.forEach((_, index) => selected.add(index)); rebuild();
          } }),
          Button({ label: "選択解除", disabled: selected.size === 0, onPress: () => { selected.clear(); rebuild(); } }),
        ] }),
        source.models.length ? List({
          label: "アペンドするモデル", height: Math.min(360, Math.max(120, source.models.length * 34 + 12)), maxHeight: 420,
          children: source.models.map((model, index) => Checkbox({
            key: `${index}:${model.id ?? ""}`,
            label: `${model.modelName} / ${model.name ?? "名称未設定"}`,
            value: selected.has(index),
            onChange: checked => { checked ? selected.add(index) : selected.delete(index); rebuild(); },
          })),
        }) : Text({ text: "このセーブデータにモデルはありません" }),
        Row({ className: "ui-modal-actions", gap: 6, justify: "end", children: [
          Button({ label: "キャンセル", onPress: close }),
          Button({ label: `アペンド (${selected.size})`, disabled: selected.size === 0, onPress: () => {
            if (appendProjectModels(editor, source.models.filter((_, index) => selected.has(index)))) close();
            else this.showAppendError(ui, "選択したモデルデータを追加できませんでした");
          } }),
        ] }),
      ],
    });
    this.appendModalHandle = ui.mountWidget(document.body, build());
  }

  private async openAppend(editor: AnimaEditor, ui: UIManager): Promise<void> {
    try {
      const source = await selectAppendSource();
      if (source) this.showAppendModels(editor, ui, source);
    } catch (error) {
      this.showAppendError(ui, error instanceof Error ? error.message : "JSONを読み込めませんでした");
    }
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
            Row({ justify: "end", children: [
              Row({ gap: 6, children: [
                Button({ label: "開く", onPress: () => editor.load() }),
                Button({ label: "アペンド", onPress: () => { void this.openAppend(editor, ui); } }),
              ] }),
            ] }),
            TextField({
              label: "検索", value: this.query, onChange: () => {},
              onCommit: value => {
                if (value === this.query) return;
                this.query = value;
                this.renderedQuery = value;
                if (this.handle) ui.resetWidget(this.handle, build());
              },
            }),
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
              observeEvents: ["objects", "animations", "textures"].map(path => change(editor.editorState, path)),
              read: () => [...editor.editorState.objects.selectedObjectsID, ...editor.editorState.animations.selectedAnimationsID, ...(editor.editorState.textures.activeTextureID ? [editor.editorState.textures.activeTextureID] : [])],
            }),
            onSelect: (id, additive) => {
              const model = groups.flatMap(group => [...group.models]).find(model => model.id === id);
              if (model) commitUISelection(commands, model, additive);
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

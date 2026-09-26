import { Model_Sprite } from "../../../core/project/model/Sprite";
import { BoneReference, Model_Armature } from "../../../core/project/model/Armature";
import { Model_Texture } from "../../../core/project/model/Texture";
import type { AnimaEditor } from "../../../editor/Editor";
import { CommandManager } from "../../../manager/CommandManager";
import { EditorEvent, EditorEventType } from "../../../manager/EventManager";
import { UIManager } from "../../../manager/ui/UIManager";
import type { WidgetHandle } from "../../../manager/ui/WidgetTree";
import { bind, Button, RenameButton, List, Column, Header, Main, Row, Section, Select, Slider, Text, TextField } from "../../../manager/ui/components";
import type { Widget } from "../../../manager/ui/components";
import { commitUIAddValue, commitUIProperty } from "../../../manager/ui/commands";
import { UIComponent } from "../UI";
import { UIComponent_Inspector_SpaceData } from "./SpaceData";
import { Model_Animation } from "../../../core/project/model/Animation";
import { AnimationState } from "../../../editor/editorState/state/States/Animation";

export class UIComponent_Inspector extends UIComponent {
  private handle: WidgetHandle | null = null;
  private host: HTMLElement | null = null;
  private renderedListHeight = 180;

  constructor(public readonly spaceData = new UIComponent_Inspector_SpaceData()) { super({ name: "Inspector", id: 0, icon: "inf" }); }
  public override input(): void {}

  public override dispose(editor: AnimaEditor): void {
    if (this.handle) editor.getManager(UIManager)?.disposeWidget(this.handle);
    this.handle = null;
    this.host = null;
  }

  public override update(editor: AnimaEditor, parent: HTMLElement): void {
    if (this.host === parent && this.handle && this.renderedListHeight === this.spaceData.boneWeightListHeight) return;
    this.dispose(editor);
    const ui = editor.getManager(UIManager);
    const commands = editor.getManager(CommandManager);
    if (!ui || !commands) return;
    const createChangeEvent = (source: unknown, path: string) => new EditorEvent(EditorEventType.change, source, path);
    const build = (): Widget => {
      const model = editor.editorState.activeObject;
      const children: Widget[] = [];
      if (model) {
        const state = editor.editorState.getModelStateByID(model.id);
        if (model instanceof Model_Sprite || model instanceof Model_Armature) {
          children.push(TextField({
            label: "名前",
            observeEvents: [createChangeEvent(model, "name")],
            value: bind({ read: () => model.name }),
            onChange: () => {},
            onCommit: value => { if (model.name !== value) commitUIProperty(commands, model, "name", value); },
          }));
          children.push(Slider({ label: "透明度", value: 1, min: 0, max: 1, disabled: true, onChange: () => {} }));
        }
        if (model instanceof Model_Sprite) {
          const texture = (): Widget => Select({
            label: "テクスチャ",
            observeEvents: [
              new EditorEvent(EditorEventType.add, editor.project, "models"),
              new EditorEvent(EditorEventType.delete, editor.project, "models"),
              ...editor.project.getModelsByType(Model_Texture).map(item => {
                return createChangeEvent(item, "name");
              }),
            ],
            rebuild: texture,
            options: editor.project.getModelsByType(Model_Texture).map(item => ({ value: item.id, label: item.name })),
            value: bind({ read: () => model.textureID.modelID, observeEvents: [createChangeEvent(model, "textureID.modelID")] }),
            onChange: value => { if (value !== null) commitUIProperty(commands, model, "textureID.modelID", value); },
          });
          const weights = (): Widget => {
            return Section({
              title: "ボーンウェイト", rebuild: weights,
              observeEvents: [
                new EditorEvent(EditorEventType.add, model, "boneWeights"),
                new EditorEvent(EditorEventType.delete, model, "boneWeights"),
              ],
              children: [
                List({
                  label: "ボーンウェイト",
                  height: this.spaceData.boneWeightListHeight,
                  onHeightChange: height => { this.spaceData.boneWeightListHeight = height; this.renderedListHeight = height; },
                  children: Object.entries(model.boneWeights).map(([boneWeightID, weight]) => {
                    return RenameButton({
                      key: boneWeightID,
                      label: bind({ read: () => weight.name, observeEvents: [createChangeEvent(model, `boneWeights.${boneWeightID}.name`)] }),
                      pressed: bind({
                        observeEvents: [createChangeEvent(state, "activeBoneWeightID")],
                        read: () => state !== null && "activeBoneWeightID" in state && state.activeBoneWeightID === boneWeightID,
                      }),
                      onPress: () => {
                        if (state && "activeBoneWeightID" in state && state.activeBoneWeightID !== boneWeightID) commitUIProperty(commands, state, "activeBoneWeightID", boneWeightID);
                      },
                      onRename: name => {
                        if (model.boneWeights[boneWeightID]?.name !== name) commitUIProperty(commands, model, `boneWeights.${boneWeightID}.name`, name);
                      },
                    });
                  })
                }), Row({ children: [
                  Button({ label: "追加", onPress: () => {
                    commitUIAddValue(commands, model, "boneWeights", crypto.randomUUID(), Model_Sprite.createBoneWeight({
                      name: "名称未設定",
                      weights: {},
                      boneID: new BoneReference({aramatureID: "", boneID: ""})
                    }));
                  }}),
                  Button({ label: "削除", disabled: true, onPress: () => {} }),
                ]})
              ],
            });
          };
          const boneTarget = (): Widget => Select({
            label: "選択中", disabled: true, value: null, placeholder: "未選択", onChange: () => {},
            rebuild: boneTarget,
            observeEvents: [
              new EditorEvent(EditorEventType.add, editor.project, "models"),
              new EditorEvent(EditorEventType.delete, editor.project, "models"),
              ...editor.project.getModelsByType(Model_Armature).flatMap(arm => [
                // createChangeEvent(arm, ""),
                new EditorEvent(EditorEventType.add, arm, "bones"),
                new EditorEvent(EditorEventType.delete, arm, "bones"),
              ]),
            ],
            options: editor.project.getModelsByType(Model_Armature).flatMap(arm =>
              Object.entries(arm.bones).map(([boneID, bone]) => ({ value: arm.id + "&" + boneID, label: arm.name + ": " + bone.name }))),
          });
          children.push(texture(), weights(), boneTarget());
        }
        if (model instanceof Model_Animation && state instanceof AnimationState) {
          const tracks = (): Widget => List({
            label: "トラック",
            observeEvents: [
              new EditorEvent(EditorEventType.add, model, "tracks"),
              new EditorEvent(EditorEventType.delete, model, "tracks"),
            ],
            rebuild: tracks,
            children: Object.entries(model.tracks).map(([trackID, track]) => {
              return RenameButton({
                key: trackID,
                label: bind({ read: () => track.name, observeEvents: [createChangeEvent(model, `tracks.${trackID}.name`)] }),
                pressed: bind({
                  observeEvents: [createChangeEvent(state, "activeTrackID")],
                  read: () => state !== null && "activeTrackID" in state && state.activeTrackID === trackID,
                }),
                onPress: () => {
                  if (state && "activeTrackID" in state && state.activeTrackID !== trackID) commitUIProperty(commands, state, "activeTrackID", trackID);
                },
                onRename: name => {
                  if (model.tracks[trackID]?.name !== name) commitUIProperty(commands, model, `tracks.${trackID}.name`, name);
                },
              });
            })
          });
          children.push(tracks());
        }
      }
      return Column({
        className: "ui-panel", rebuild: build,
        observeEvents: [createChangeEvent(editor, "project"), createChangeEvent(editor.editorState, "activeObject")],
        children: [Header({ children: [Text({ text: "Inspector" })] }), Main({ gap: 8, children })],
      });
    };
    this.handle = ui.mountWidget(parent, build());
    this.host = parent;
    this.renderedListHeight = this.spaceData.boneWeightListHeight;
  }
}

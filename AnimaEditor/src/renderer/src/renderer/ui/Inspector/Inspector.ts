import { Model_Sprite } from "../../../core/project/model/Sprite";
import { BoneReference, Model_Armature } from "../../../core/project/model/Armature";
import { Model_Texture } from "../../../core/project/model/Texture";
import type { AnimaEditor } from "../../../editor/Editor";
import { CommandManager } from "../../../manager/CommandManager";
import { EditorEvent, EditorEventType } from "../../../manager/EventManager";
import { UIManager } from "../../../manager/ui/UIManager";
import type { WidgetHandle } from "../../../manager/ui/WidgetTree";
import { bind, Button, RenameButton, List, Column, Header, Main, Row, Section, Select, Slider, Text, TextField } from "../../../manager/ui/components";
import type { SelectOption, Widget } from "../../../manager/ui/components";
import { commitUIAddValue, commitUIProperties, commitUIProperty } from "../../../manager/ui/commands";
import { UIComponent } from "../UI";
import { UIComponent_Inspector_SpaceData } from "./SpaceData";
import { Model_Animation } from "../../../core/project/model/Animation";
import { AnimationState } from "../../../editor/editorState/state/States/Animation";
import { ArmatureState } from "../../../editor/editorState/state/States/Armature";

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
        if (model instanceof Model_Sprite || model instanceof Model_Armature || model instanceof Model_Animation) {
          children.push(TextField({
            label: "名前",
            observeEvents: [createChangeEvent(model, "name")],
            value: bind({ read: () => model.name }),
            onChange: () => {},
            onCommit: value => { if (model.name !== value) commitUIProperty(commands, model, "name", value); },
          }));
          children.push(Slider({ label: "透明度", value: 1, min: 0, max: 1, disabled: true, onChange: () => {} }));
        }
        if (model instanceof Model_Sprite || model instanceof Model_Armature) {
          const animationBinding = (): Widget => {
            const animation = editor.project.getModelByID(model.animation.animationID);
            const animations = editor.project.getModelsByType(Model_Animation);
            const paths: SelectOption[] = model instanceof Model_Armature
              ? Object.entries(model.bones).flatMap(([id, bone]) => [
                  ["position.0", "座標X"], ["position.1", "座標Y"], ["rotation", "回転"], ["scale.0", "大きさX"], ["scale.1", "大きさY"],
                ].map(([property, label]) => ({ value: `bones.${id}.animation.${property}`, label: `${bone.name} / ${label}` })))
              : Object.keys(model.vertices).flatMap(id => [0, 1].map(axis => ({ value: `vertices.${id}.${axis}`, label: `${id} / ${axis === 0 ? "X" : "Y"}` })));
            return Section({ title: "アニメーション", rebuild: animationBinding,
              observeEvents: [
                createChangeEvent(model, "animation"),
                createChangeEvent(model, model instanceof Model_Armature ? "bones" : "vertices"),
                new EditorEvent(EditorEventType.add, model, model instanceof Model_Armature ? "bones" : "vertices"),
                new EditorEvent(EditorEventType.delete, model, model instanceof Model_Armature ? "bones" : "vertices"),
                createChangeEvent(editor.project, "models"),
                new EditorEvent(EditorEventType.add, editor.project, "models"), new EditorEvent(EditorEventType.delete, editor.project, "models"),
                ...animations.map(item => createChangeEvent(item, "name")),
                ...(animation instanceof Model_Animation ? [createChangeEvent(animation, "tracks"), new EditorEvent(EditorEventType.add, animation, "tracks"), new EditorEvent(EditorEventType.delete, animation, "tracks")] : []),
              ],
              children: [
                Select({ label: "Animation", value: model.animation.animationID, searchable: true,
                  options: [{ value: "", label: "未割り当て" }, ...animations.map(item => ({ value: item.id, label: item.name }))],
                  onChange: value => {
                    if (value === null || value === model.animation.animationID) return;
                    commitUIProperties(commands, "Assign animation", [
                      { model, path: "animation.animationID", value }, { model, path: "animation.trackMap", value: {} },
                    ]);
                  } }),
                ...(animation instanceof Model_Animation ? [List({ label: "トラック割り当て", children: paths.map(option => Select({
                  label: option.label, searchable: true, value: model.animation.trackMap[option.value] ?? "",
                  options: [{ value: "", label: "未割り当て" }, ...Object.entries(animation.tracks).map(([id, track]) => ({ value: id, label: track.name }))],
                  onChange: value => {
                    if (value === null) return;
                    const trackMap = { ...model.animation.trackMap };
                    if (value) trackMap[option.value] = value; else delete trackMap[option.value];
                    commitUIProperty(commands, model, "animation.trackMap", trackMap);
                  },
                })) })] : []),
              ],
            });
          };
          children.push(animationBinding());
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
            value: bind({ read: () => model.texture.modelID, observeEvents: [createChangeEvent(model, "texture.modelID")] }),
            onChange: value => { if (value !== null) commitUIProperty(commands, model, "texture.modelID", value); },
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
        if (model instanceof Model_Armature && state instanceof ArmatureState) {
          const bones = (): Widget => List({
            label: "ボーン",
            observeEvents: [
              new EditorEvent(EditorEventType.add, model, "tracks"),
              new EditorEvent(EditorEventType.delete, model, "tracks"),
            ],
            rebuild: bones,
            children: Object.entries(model.bones).map(([boneID, bone]) => {
              return RenameButton({
                key: boneID,
                label: bind({ read: () => bone.name, observeEvents: [createChangeEvent(model, `bones.${boneID}.name`)] }),
                // pressed: bind({
                //   observeEvents: [createChangeEvent(state, "activeTrackID")],
                //   read: () => state !== null && "activeTrackID" in state && state.activeTrackID === boneID,
                // }),
                onPress: () => {
                  // if (state && "activeTrackID" in state && state.activeTrackID !== boneID) commitUIProperty(commands, state, "activeTrackID", boneID);
                },
                onRename: name => {
                  if (model.bones[boneID]?.name !== name) commitUIProperty(commands, model, `bones.${boneID}.name`, name);
                },
              });
            })
          });
          // const activeTrack = (): Widget => Section({
          //   title: "トラック",
          //   observeEvents: [
          //     createChangeEvent(state, "activeTrackID"),
          //     new EditorEvent(EditorEventType.delete, model, "tracks"),
          //   ],
          //   rebuild: activeTrack,
          //   children: [
          //     TextField({
          //       label: "名前",
          //       observeEvents: state.activeTrackID ? [createChangeEvent(model, `tracks.${state.activeTrackID}.name`)] : [],
          //       value: bind({ read: () => state.activeTrackID ? model.tracks[state.activeTrackID].name : "未選択" }),
          //       onChange: () => {},
          //       onCommit: value => { if (model.tracks[state.activeTrackID].name !== value) commitUIProperty(commands, model, `tracks.${state.activeTrackID}.name`, value); },
          //     }),
          //     TextField({
          //       label: "対象",
          //       observeEvents: state.activeTrackID ? [createChangeEvent(model, `tracks.${state.activeTrackID}.path`)] : [],
          //       value: bind({ read: () => state.activeTrackID ? model.tracks[state.activeTrackID].path : "" }),
          //       onChange: () => {},
          //       onCommit: value => { if (model.tracks[state.activeTrackID].path !== value) commitUIProperty(commands, model, `tracks.${state.activeTrackID}.path`, value); },
          //     })
          //   ]
          // });
          children.push(bones());
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
          const tracksAction = (): Widget => Row({
            children: [
              Button({ label: "追加", onPress: () => {
                commitUIAddValue(commands, model, "tracks", crypto.randomUUID(), Model_Animation.createTrack({
                  name: "名称未設定",
                }));
              }}),
              Button({ label: "削除", disabled: true, onPress: () => {} }),
            ]});
          const activeTrack = (): Widget => Section({
            title: "トラック",
            observeEvents: [
              createChangeEvent(state, "activeTrackID"),
              new EditorEvent(EditorEventType.delete, model, "tracks"),
            ],
            rebuild: activeTrack,
            children: [
              TextField({
                label: "名前",
                observeEvents: state.activeTrackID ? [createChangeEvent(model, `tracks.${state.activeTrackID}.name`)] : [],
                value: bind({ read: () => model.tracks[state.activeTrackID]?.name ?? "未選択" }),
                disabled: !model.tracks[state.activeTrackID],
                onChange: () => {},
                onCommit: value => { if (model.tracks[state.activeTrackID] && model.tracks[state.activeTrackID].name !== value) commitUIProperty(commands, model, `tracks.${state.activeTrackID}.name`, value); },
              }),
            ]
          });
          children.push(tracks(), tracksAction(), activeTrack());
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

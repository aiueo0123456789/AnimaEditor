import { Model_Sprite } from "../../../core/project/model/Sprite";
import { Model_SceneConfig } from "../../../core/project/configModel/Scene";
import { BoneReference, Model_Armature } from "../../../core/project/model/Armature";
import { Model_Texture } from "../../../core/project/model/Texture";
import type { AnimaEditor } from "../../../editor/Editor";
import { CommandManager } from "../../../manager/CommandManager";
import { EditorEvent, EditorEventType } from "../../../manager/EventManager";
import { UIManager } from "../../../manager/ui/UIManager";
import type { WidgetHandle } from "../../../manager/ui/WidgetTree";
import { bind, Button, Checkbox, ColorField, NumberField, RenameButton, List, Column, Header, Main, Row, Section, Select, Slider, TextField } from "../../../manager/ui/components";
import type { SelectOption, Widget } from "../../../manager/ui/components";
import { commitUIAddValue, commitUIProperties, commitUIProperty } from "../../../manager/ui/commands";
import { UIComponent } from "../UI";
import { UIComponent_Inspector_SpaceData } from "./SpaceData";
import { Model_Animation } from "../../../core/project/model/Animation";
import { AnimationState } from "../../../editor/editorState/state/States/Animation";
import { ArmatureState } from "../../../editor/editorState/state/States/Armature";

export class UIComponent_Inspector extends UIComponent {
  private mode: "scene" | "object" | "animation" = "object";
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
      const model = this.mode === "object" ? editor.editorState.activeObject : this.mode === "animation" ? editor.editorState.activeAnimation : null;
      const children: Widget[] = [];
      if (this.mode === "scene") {
        const scene = editor.project.sceneConfig;
        const masks = (): Widget => Section({ title: "マスク", rebuild: masks,
          observeEvents: [createChangeEvent(scene, "masks"),
            new EditorEvent(EditorEventType.add, scene, "masks"), new EditorEvent(EditorEventType.delete, scene, "masks")],
          children: [
            List({ label: "マスク一覧", children: Object.entries(scene.masks).map(([id, mask]) => Column({ key: id, children: [
              TextField({ label: "名前", value: mask.name, onChange: () => {},
                onCommit: name => commitUIProperty(commands, scene, `masks.${id}.name`, name) }),
              NumberField({ label: "適用率", min: 0, max: 1, step: 0.01, value: mask.strength, onChange: () => {},
                onCommit: value => commitUIProperty(commands, scene, `masks.${id}.strength`, Math.max(0, Math.min(1, value))) }),
              Button({ label: "削除", onPress: () => commitUIProperties(commands, "Delete mask", [
                ...editor.project.getModelsByType(Model_Sprite).flatMap(sprite => [
                  ...(sprite.maskSource.maskID === id ? [{ model: sprite, path: "maskSource.maskID", value: "" }] : []),
                  ...(sprite.maskTarget.some(reference => reference.maskID === id) ? [{ model: sprite, path: "maskTarget",
                    value: sprite.maskTarget.filter(reference => reference.maskID !== id) }] : []),
                ]),
                { model: scene, path: "masks", value: Object.fromEntries(Object.entries(scene.masks).filter(([key]) => key !== id)) },
              ]) }),
            ] })) }),
            Button({ label: "マスク追加", onPress: () => {
              const id = crypto.randomUUID();
              commitUIProperty(commands, scene, "masks", { ...scene.masks, [id]: Model_SceneConfig.createMask({ name: "Mask" }) });
            } }),
          ],
        });
        children.push(
          TextField({ label: "シーン名", value: bind({ read: () => scene.projectName,
            observeEvents: [createChangeEvent(scene, "projectName")] }), onChange: () => {},
            onCommit: value => { if (value !== scene.projectName) commitUIProperty(commands, scene, "projectName", value); } }),
          masks(),
        );
      }
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
          // children.push(Slider({ label: "透明度", value: 1, min: 0, max: 1, disabled: true, onChange: () => {} }));
        }
        if (model instanceof Model_Sprite) {
          const masks = (): Widget => {
            const scene = editor.project.sceneConfig;
            const options = [{ value: "", label: "なし" }, ...Object.entries(scene.masks).map(([id, mask]) => ({ value: id, label: mask.name }))];
            return Section({ title: "マスク", rebuild: masks,
              observeEvents: [createChangeEvent(scene, "masks"),
                new EditorEvent(EditorEventType.add, scene, "masks"), new EditorEvent(EditorEventType.delete, scene, "masks")],
              children: [
                Select({ label: "適用するマスク", options,
                  value: bind({ read: () => model.maskSource.maskID, observeEvents: [createChangeEvent(model, "maskSource.maskID")] }),
                  onChange: value => { if (value !== null) commitUIProperty(commands, model, "maskSource.maskID", value); },
                }),
                Select({ label: "適用方法", options: [{ value: "0", label: "通常" }, { value: "1", label: "反転" }],
                  value: bind({ read: () => String(model.maskType), observeEvents: [createChangeEvent(model, "maskType")] }),
                  onChange: value => { if (value !== null) commitUIProperty(commands, model, "maskType", Number(value)); },
                }),
                List({ label: "書き込み先", children: Object.entries(scene.masks).map(([id, mask]) => Checkbox({
                  label: mask.name,
                  value: bind({ read: () => model.maskTarget.some(reference => reference.maskID === id),
                    observeEvents: [createChangeEvent(model, "maskTarget")] }),
                  onChange: checked => commitUIProperty(commands, model, "maskTarget",
                    [...model.maskTarget.filter(reference => reference.maskID !== id), ...(checked ? [{ maskID: id }] : [])]),
                })) }),
              ],
            });
          };
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
          const visual = (): Widget => Section({
            title: "見た目",
            children: [
              Slider({ label: "不透明度", min: 0, max: 1, step: 0.01,
                onChange: () => {},
                value: bind({ read: () => model.alpha, observeEvents: [createChangeEvent(model, "alpha")] }),
                onCommit: value => commitUIProperty(commands, model, "alpha", Math.max(0, Math.min(1, value))),
              }),
              texture(),
            ]
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
          children.push(visual(), masks(), weights(), boneTarget());
        }
        if (model instanceof Model_Armature && state instanceof ArmatureState) {
          const groups = (): Widget => {
            const id = state.activeGroupID;
            const group = model.groups[id];
            return Section({
              title: "ボーングループ", rebuild: groups,
              observeEvents: [createChangeEvent(state, "activeGroupID"), createChangeEvent(model, "groups"),
                new EditorEvent(EditorEventType.add, model, "groups"), new EditorEvent(EditorEventType.delete, model, "groups")],
              children: [
                List({ label: "ボーングループ一覧", children: Object.entries(model.groups).map(([groupID, item]) => Button({
                  key: groupID, label: item.name, pressed: groupID === id,
                  onPress: () => commitUIProperty(commands, state, "activeGroupID", groupID),
                })) }),
                Row({ gap: 4, children: [
                  Button({ label: "グループ追加", icon: "plus", onPress: () => {
                    const groupID = crypto.randomUUID();
                    commitUIProperties(commands, "Add bone group", [
                      { model, path: "groups", value: { ...model.groups, [groupID]: new Model_Armature.BoneGroup({ name: `グループ${Object.keys(model.groups).length + 1}`, color: [0.3, 0.7, 0.5, 1] }) } },
                      { model: state, path: "activeGroupID", value: groupID },
                    ]);
                  } }),
                  Button({ label: "グループ削除", disabled: !group, onPress: () => {
                    if (!group) return;
                    const remaining = { ...model.groups }; delete remaining[id];
                    commitUIProperties(commands, "Delete bone group", [
                      { model, path: "groups", value: remaining },
                      { model: state, path: "activeGroupID", value: "" },
                      ...Object.entries(model.bones).filter(([, bone]) => bone.groupID === id).map(([boneID]) => ({ model, path: `bones.${boneID}.groupID`, value: "" })),
                    ]);
                  } }),
                ] }),
                ...(group ? [
                  TextField({ label: "グループ名", value: group.name, onChange: () => {},
                    onCommit: name => { if (name !== group.name) commitUIProperty(commands, model, `groups.${id}.name`, name); } }),
                  ColorField({ label: "色", value: "#" + group.color.slice(0, 3).map(value => Math.round(Math.max(0, Math.min(1, value)) * 255).toString(16).padStart(2, "0")).join(""),
                    onChange: hex => commitUIProperty(commands, model, `groups.${id}.color`, [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255).concat(group.color[3])) }),
                  NumberField({ label: "不透明度", min: 0, max: 1, step: 0.05, value: group.color[3], onChange: () => {},
                    onCommit: alpha => commitUIProperty(commands, model, `groups.${id}.color`, [...group.color.slice(0, 3), alpha]) }),
                ] : []),
              ],
            });
          };
          const bones = (): Widget => {
            const id = state.activeBoneID;
            const bone = model.bones[id];
            return Section({
              title: "ボーン", rebuild: bones,
              observeEvents: [createChangeEvent(state, "activeBoneID"), createChangeEvent(model, "bones"), createChangeEvent(model, "groups"),
                new EditorEvent(EditorEventType.add, model, "bones"), new EditorEvent(EditorEventType.delete, model, "bones"),
                new EditorEvent(EditorEventType.add, model, "groups"), new EditorEvent(EditorEventType.delete, model, "groups")],
              children: [
                List({ label: "ボーン一覧", children: Object.entries(model.bones).map(([boneID, item]) => Button({
                  key: boneID, label: item.name, pressed: boneID === id,
                  onPress: () => commitUIProperty(commands, state, "activeBoneID", boneID),
                })) }),
                ...(bone ? [
                  TextField({ label: "ボーン名", value: bone.name, onChange: () => {},
                    onCommit: name => { if (name !== bone.name) commitUIProperty(commands, model, `bones.${id}.name`, name); } }),
                  Select({ label: "グループ", value: model.groups[bone.groupID] ? bone.groupID : "",
                    options: [{ value: "", label: "未割り当て" }, ...Object.entries(model.groups).map(([groupID, group]) => ({ value: groupID, label: group.name }))],
                    onChange: value => { if (value !== null) commitUIProperty(commands, model, `bones.${id}.groupID`, value); },
                  }),
                ] : []),
              ],
            });
          };
          children.push(groups(), bones());
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
        observeEvents: [createChangeEvent(editor, "project"), ...(this.mode === "scene" ? [createChangeEvent(editor.project.sceneConfig, "masks")] :
          [createChangeEvent(editor.editorState, this.mode === "object" ? "objects" : "animations")])],
        children: [Header({ gap: 8, children: [
          Row({ className: "ui-inspector-modes", gap: 1, children: (["scene", "object", "animation"] as const).map(mode => Button({
            label: mode === "scene" ? "Scene" : mode === "object" ? "Object" : "Animation",
            pressed: this.mode === mode,
            onPress: () => {
              if (this.mode === mode) return;
              this.mode = mode;
              if (this.handle) ui.invalidateWidget(this.handle);
            },
          })) }),
        ] }), Main({ gap: 8, children })],
      });
    };
    this.handle = ui.mountWidget(parent, build());
    this.host = parent;
    this.renderedListHeight = this.spaceData.boneWeightListHeight;
  }
}

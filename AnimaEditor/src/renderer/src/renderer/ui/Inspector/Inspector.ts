import { Model_Sprite } from "../../../core/project/model/Sprite";
import { AnimaEditor } from "../../../editor/Editor";
import { JTag } from "../../../library/JTag/JTag";
import { JTag_CustomTag } from "../../../library/JTag/tag/CustomTag";
import { JTag_DBInput } from "../../../library/JTag/tag/DBInput";
import { JTag_Label } from "../../../library/JTag/tag/Label";
import { JTag_Section } from "../../../library/JTag/tag/Section";
import { JTag_Select } from "../../../library/JTag/tag/Select";
import { setPropertyOnInput, UIComponent } from "../UI";
import { JTag_Base } from "../../../library/JTag/tag/Base";
import { Model_Texture } from "../../../core/project/model/Texture";
import { Model_Armature, Model_Bone } from "../../../core/project/model/Armature";
import { CommandManager } from "../../../manager/CommandManager";
import { JTag_List } from "../../../library/JTag/tag/List";
import { JTag_Container } from "../../../library/JTag/tag/Container";
import { JTag_Slider } from "../../../library/JTag/tag/Slider";
import { JTag_Button } from "../../../library/JTag/tag/Button";
import { UIManager } from "../../../manager/UIManager";
import { EditorEvent, EditorEventType } from "../../../manager/EventManager";
import { ContextManager } from "../../../manager/ContextManager";
import { SetPropertyCommand, SetPropertyCommandInput } from "../../../editor/command/SetProperty";

function armAndBoneToString(arm: Model_Armature | null, bone: Model_Bone | null) {
  if (arm && bone) return `${arm.id}&${bone.id}`;
  else return "";
}

let counter = 0;
export class UIComponent_Inspector extends UIComponent {
  private domMap: {
    sprite: {
      section: JTag_Section,
      name: JTag_DBInput,
      textureSelect: JTag_Select,
      boneWeights: JTag_List,
      boneWeightsActionPlus: JTag_Button,
      boneWeightsActionMinus: JTag_Button,
      boneWeightTargetSelect: JTag_Select,
    },
    armature: {
      section: JTag_Section,
      name: JTag_DBInput,
    },
  }
  constructor() {
    super({ name: "Inspector", id: counter, icon: "inf" });
    counter++;

    this.domMap = {
      sprite: {
        section: JTag.createTag(JTag_Section),
        name: JTag.createTag(JTag_DBInput),
        textureSelect: JTag.createTag(JTag_Select),
        boneWeights: JTag.createTag(JTag_List),
        boneWeightsActionPlus: JTag.createTag(JTag_Button),
        boneWeightsActionMinus: JTag.createTag(JTag_Button),
        boneWeightTargetSelect: JTag.createTag(JTag_Select),
      },
      armature: {
        section: JTag.createTag(JTag_Section),
        name: JTag.createTag(JTag_DBInput),
      },
    };
  }

  public override input(): void {
  }

  public override update(editor: AnimaEditor, parent: JTag_CustomTag): void {
    const uiManager = editor.getManager(UIManager);
    if (!uiManager) return ;
    const contextManager = editor.getManager(ContextManager);
    if (!contextManager) return ;
    const activeObjectSourceContext = contextManager.activeObjectSourceContext;
    const projectSourceContext = contextManager.projectSourceContext;

    const libraryJTag = editor.library.JTag;
    if (!parent.getElementByID("Inspector")) {
      libraryJTag.clear(parent);
      const container = JTag.createTag(JTag_Container);
      container.body.classList.add("group-container");
      container.id = `Inspector`;
      libraryJTag.append(parent, container);

      const header = JTag.createTag(JTag_Base);
      header.body.classList.add("header");

      const iconTag = JTag.createTag(JTag_Button);
      iconTag.setIcon(JTag.getSvg(this.icon));
      iconTag.setText(this.name);
      libraryJTag.append(header, iconTag);

      const body = JTag.createTag(JTag_Base);
      body.body.classList.add("main");

      libraryJTag.append(container, header);
      libraryJTag.append(container, body);

      { // スプライト
        const section = JTag.createTag(JTag_Section);
        section.id = "Inspector-Sprite";
        section.setTitle("Sprite");

        uiManager.addTagUpdater(
          UIManager.createTagUpdater({
            targetEvents: [
              new EditorEvent(EditorEventType.change, editor.editorState, "activeObject"),
            ],
            tagMap: {section: section},
            inputMap: {activeObject: activeObjectSourceContext},
            update: (input) => {
              const activeObject = input.inputMap.activeObject;
              if (activeObject instanceof Model_Sprite) input.tagMap.section.body.classList.remove("hidden");
              else input.tagMap.section.body.classList.add("hidden");
            },
          })
        );

        libraryJTag.append(body, section);

        const label = JTag.createTag(JTag_Label);
        label.setLabel("名前");
        const name = JTag.createTag(JTag_DBInput);
        name.setValue("未設定");

        uiManager.addTagUpdater(
          UIManager.createTagUpdater({
            targetEvents: [
              new EditorEvent(EditorEventType.change, editor, "project"),
              new EditorEvent(EditorEventType.change, editor.editorState, "activeObject"),
              new EditorEvent(EditorEventType.change, activeObjectSourceContext, "name")
            ],
            tagMap: {name: name},
            inputMap: {activeObject: activeObjectSourceContext},
            update: (input) => {
              const activeObject = input.inputMap.activeObject;
              if (activeObject instanceof Model_Sprite) input.tagMap.name.setValue(activeObject.name);
            },
          })
        );

        uiManager.addInputer(UIManager.createInputer({
          targetEvents: [
            new EditorEvent(EditorEventType.change, editor, "project"),
            new EditorEvent(EditorEventType.change, editor.editorState, "activeObject"),
          ],
          tagMap: {name: name},
          inputMap: {activeObject: activeObjectSourceContext},
          action: (commandManager, input) => {
            console.log(commandManager, input)
            const change = input.tagMap.name.addEventListener("change", () => {
              commandManager.setCommandRecorder();
              commandManager.commandRecorder?.setCommand(SetPropertyCommand, {
                model: input.inputMap.activeObject,
                path: "name",
                newValue: input.tagMap.name.value,
              } as SetPropertyCommandInput);
              commandManager.commandRecorder?.finishCommand();
              commandManager.finishCommandRecorder();
            });
            return [change];
          }
        }));

        // setPropertyOnInput(commandManager, name, activeObjectSourceContext, "name");

        libraryJTag.append(section, label);
        libraryJTag.append(section, name);

        const label_alpha = JTag.createTag(JTag_Label);
        label_alpha.setLabel("透明度");
        const slider = JTag.createTag(JTag_Slider);
        slider.setMin(0);
        slider.setMax(1);
        slider.setValue(1);
        libraryJTag.append(section, label_alpha);
        libraryJTag.append(section, slider);

        const labelParentSelect = JTag.createTag(JTag_Label);
        labelParentSelect.setLabel("テクスチャ");

        const textureSelect = JTag.createTag(JTag_Select);

        // models(textureの可能性)が追加されたらSelectを更新する
        uiManager.addTagUpdater(
          UIManager.createTagUpdater({
            targetEvents: [
              new EditorEvent(EditorEventType.change, editor, "project"),
              new EditorEvent(EditorEventType.add, projectSourceContext, "models"),
              new EditorEvent(EditorEventType.delete, projectSourceContext, "models")
            ],
            tagMap: {texture: textureSelect},
            inputMap: {project: projectSourceContext},
            update: (input) => {
              if (!input.inputMap.project) return ;
              input.tagMap.texture.setOptions(input.inputMap.project.getModelsByType(Model_Texture).map(texture => JTag_Select.createOption(texture.id, texture.name)));
            },
          })
        );

        uiManager.addTagUpdater(
          UIManager.createTagUpdater({
            targetEvents: [
              new EditorEvent(EditorEventType.change, editor, "project"),
              new EditorEvent(EditorEventType.change, editor.editorState, "activeObject"),
              new EditorEvent(EditorEventType.change, activeObjectSourceContext, "textureID.modelID")
            ],
            tagMap: {texture: textureSelect},
            inputMap: {activeObject: activeObjectSourceContext},
            update: (input) => {
              const activeObject = input.inputMap.activeObject;
              if (activeObject instanceof Model_Sprite) input.tagMap.texture.setValue(activeObject.textureID.modelID);
            },
          })
        );
        // setPropertyCommandDBInput(commandManager, textureSelect, activeObjectSourceContext, "textureID.modelID");

        libraryJTag.append(section, labelParentSelect);
        libraryJTag.append(section, textureSelect);

        const boneWeightsLabel = JTag.createTag(JTag_Label);
        boneWeightsLabel.setLabel("ボーンウェイト");

        const boneWeightsList = JTag.createTag(JTag_List);
        boneWeightsList.setMinHeight(100);
        libraryJTag.append(section, boneWeightsLabel);
        libraryJTag.append(section, boneWeightsList);

        const actionPlusBtn = JTag.createTag(JTag_Button);
        actionPlusBtn.setIcon(JTag.getSvg("plus"));
        libraryJTag.append(boneWeightsList, actionPlusBtn, 1);

        const actionMinusBtn = JTag.createTag(JTag_Button);
        actionMinusBtn.setIcon(JTag.getSvg("minus"));
        libraryJTag.append(boneWeightsList, actionMinusBtn, 1);

        const activeWeightGroupLabel = JTag.createTag(JTag_Label);
        activeWeightGroupLabel.setLabel("選択中");
        libraryJTag.append(section, activeWeightGroupLabel);

        const targetSelect = JTag.createTag(JTag_Select);
        targetSelect.setOptionGenerator(() => {
          const options = [JTag_Select.createOption(armAndBoneToString(null, null), "未選択")];
          for (const arm of editor.project.getModelsByType(Model_Armature)) {
            for (const bone of arm.bones) {
              options.push(JTag_Select.createOption(armAndBoneToString(arm, bone), arm.name));
            }
          }
          return options;
        });

        uiManager.addTagUpdater(
          UIManager.createTagUpdater({
            targetEvents: [
              new EditorEvent(EditorEventType.change, editor, "project"),
              new EditorEvent(EditorEventType.change, editor.editorState, "activeObject"),
              new EditorEvent(EditorEventType.add, activeObjectSourceContext, "boneWeights"),
              new EditorEvent(EditorEventType.delete, activeObjectSourceContext, "boneWeights")
            ],
            tagMap: {texture: textureSelect},
            inputMap: {activeObject: activeObjectSourceContext},
            update: (input) => {
              libraryJTag.clear(boneWeightsList);
              const activeObject = input.inputMap.activeObject;
              if (!(activeObject instanceof Model_Sprite)) return ;
              for (let boneWeightIndex = 0; boneWeightIndex < activeObject.boneWeights.length; boneWeightIndex ++) {
                const boneWeight = activeObject.boneWeights[boneWeightIndex];
                const boneWeightName = JTag.createTag(JTag_DBInput);
                boneWeightName.setValue(boneWeight.name);
                // setPropertyOnInput(commandManager, boneWeightName, activeObject, `boneWeights.${boneWeightIndex}.name`);
                libraryJTag.append(boneWeightsList, boneWeightName);
              }
            },
          })
        );
        libraryJTag.append(section, targetSelect);
      }

      // アーマチュア
      {
        const section = JTag.createTag(JTag_Section);
        section.id = "Inspector-Armature";
        section.setTitle("Armature");

        uiManager.addTagUpdater(
          UIManager.createTagUpdater({
            targetEvents: [
              new EditorEvent(EditorEventType.change, editor.editorState, "activeObject"),
            ],
            tagMap: {section: section},
            inputMap: {activeObject: activeObjectSourceContext},
            update: (input) => {
              const activeObject = input.inputMap.activeObject;
              if (activeObject instanceof Model_Armature) input.tagMap.section.body.classList.remove("hidden");
              else input.tagMap.section.body.classList.add("hidden");
            },
          })
        );

        libraryJTag.append(body, section);

        const label = JTag.createTag(JTag_Label);
        label.setLabel("名前");
        const name = JTag.createTag(JTag_DBInput);
        this.domMap.armature.name = name;

        name.setValue("未設定");

        libraryJTag.append(section, label);
        libraryJTag.append(section, name);

        const label_alpha = JTag.createTag(JTag_Label);
        label_alpha.setLabel("透明度");
        const slider = JTag.createTag(JTag_Slider);
        slider.setMin(0);
        slider.setMax(1);
        slider.setValue(1);
        libraryJTag.append(section, label_alpha);
        libraryJTag.append(section, slider);
      }

      // editor.observer.add(
      //   { object: editor.editorState, property: "activeObject" },
      //   (activeObject: Models | null, lastActiveObject: Models | null) => {
      //     console.log("更新");

      //     // 初期化
      //     {
      //       for (const eventRemoveFunction of this.eventRemoveFunctions) {
      //         eventRemoveFunction();
      //       }
      //       for (const observerRemoveData of this.observerRemoveDatas) {
      //         editor.observer.remove(observerRemoveData);
      //       }
      //       this.eventRemoveFunctions.length = 0;
      //       this.observerRemoveDatas.length = 0;
      //     }

      //     if (!(this.domMap.sprite.name && this.domMap.sprite.section && this.domMap.sprite.textureSelect)) return ;
      //     if (!(this.domMap.armature.name && this.domMap.armature.section)) return ;

      //     if (!activeObject) return ;
      //     const modelState = editor.editorState.getModelStateByID(activeObject.id);

      //     if (activeObject instanceof Model_Sprite && modelState instanceof SpriteState) {
      //       this.eventRemoveFunctions.push(
      //         setEventSelect(
      //           commandManager,
      //           this.domMap.sprite.textureSelect,
      //           activeObject,
      //           "textureID",
      //         ),
      //       );

      //       // this.observerRemoveDatas.push(
      //       //   editor.observer.add(
      //       //     { object: activeObject, property: "name" },
      //       //     (name: string, oldName: string, isInit: boolean) => {
      //       //       this.domMap.sprite.name.setValue(name);
      //       //     },
      //       //     true
      //       //   ),
      //       // );
      //       this.observerRemoveDatas.push(
      //         editor.observer.add(
      //           { object: activeObject, property: "textureID" },
      //           (textureID: number, oldTextureID: number, isInit: boolean) => {
      //             this.domMap.sprite.textureSelect.setValue(String(textureID));
      //           },
      //           true
      //         ),
      //       );
      //       const bonewWeightOptions: Map<ID, JTag_Text> = new Map();
      //       this.eventRemoveFunctions.push(
      //         setEventClickForFunction(
      //           this.domMap.sprite.boneWeightsActionPlus,
      //           () => {
      //             const commandRecorder = commandManager.createCommandRecorder();
      //             const command = commandManager.createCommand(PushItemCommand);
      //             command.set(activeObject, "boneWeights", Model_Sprite.createBoneWeight({boneID: {aramatureID: "", boneID: ""}, weights: activeObject.vertices.map(v => 0), }));
      //             commandRecorder.appendCommand(command);
      //             commandManager.appendCommandRecorder(commandRecorder);
      //           },
      //         ),
      //       );
      //       this.observerRemoveDatas.push(
      //         editor.observer.add(
      //           { object: activeObject, property: "boneWeights" },
      //           (currentBoneWeights: Model_BoneWeight[], lastBoneWeights: Model_BoneWeight[], isInit: boolean) => {
      //             libraryJTag.clear(this.domMap.sprite.boneWeights);
      //             for (const boneWeight of currentBoneWeights) {
      //               const option = JTag.createTag(JTag_Text);
      //               option.setText(boneWeight.boneID.boneID !== "" ? `${boneWeight.boneID.boneID}` : "ボーン未選択");
      //               libraryJTag.append(this.domMap.sprite.boneWeights, option);

      //               bonewWeightOptions.set(boneWeight.id, option);

      //               this.eventRemoveFunctions.push(
      //                 setEventClick(
      //                   commandManager,
      //                   option,
      //                   modelState,
      //                   "activeBoneWeightBoneID",
      //                   boneWeight.id,
      //                 ),
      //               );
      //             }
      //           },
      //           true
      //         ),
      //       );
      //       this.observerRemoveDatas.push(
      //         editor.observer.add(
      //           { object: modelState, property: "activeBoneWeightBoneID" },
      //           (currentBoneWeightID: ID, lastBoneWeightID: ID, isInit: boolean) => {
      //             const option = bonewWeightOptions.get(currentBoneWeightID);
      //             if (option) option.body.classList.add("active");
      //             const lastOption = bonewWeightOptions.get(lastBoneWeightID);
      //             if (lastOption) lastOption.body.classList.remove("active");

      //             const bw = activeObject.boneWeights.find(bw => bw.id == currentBoneWeightID);
      //             if (bw) {
      //               this.eventRemoveFunctions.push(
      //                 setEventSelect(
      //                   commandManager,
      //                   this.domMap.sprite.boneWeightTargetSelect,
      //                   bw,
      //                   "boneID",
      //                   (value: string) => stringToBoneReference(value)
      //                 ),
      //               );
      //               // this.observerRemoveDatas.push(
      //               //   editor.observer.add(
      //               //     {object: bw.boneID, property: "aramatureID"},
      //               //     (currentBoneID: BoneReference, lastBoneID: BoneReference, isInit: boolean) => {
      //               //       this.domMap.sprite.boneWeightTargetSelect.setValue(boneReferenceToString(currentBoneID), false);
      //               //     },
      //               //     true
      //               //   ),
      //               // );
      //               this.observerRemoveDatas.push(
      //                 editor.observer.add(
      //                   {object: bw.boneID, property: "boneID"},
      //                   (currentBoneID: BoneReference, lastBoneID: BoneReference, isInit: boolean) => {
      //                     console.log("更新", currentBoneID, lastBoneID)
      //                     this.domMap.sprite.boneWeightTargetSelect.setValue(boneReferenceToString(currentBoneID), false);
      //                   },
      //                   true
      //                 ),
      //               );
      //             }
      //           },
      //           true
      //         ),
      //       );
      //       const section = this.domMap.sprite.section;
      //       section.body.classList.remove("hidden");
      //     } else {
      //       const section = this.domMap.sprite.section;
      //       section.body.classList.add("hidden");
      //     }
      //     if (activeObject instanceof Model_Armature) {
      //       this.eventRemoveFunctions.push(
      //         setEventDBInput(
      //           commandManager,
      //           this.domMap.armature.name,
      //           activeObject,
      //           "name",
      //         ),
      //       );

      //       editor.observer.add(
      //         { object: activeObject, property: "name" },
      //         () => {
      //           this.domMap.armature.name.setValue(activeObject.name);
      //         },
      //       );

      //       const section = this.domMap.armature.section;
      //       section.body.classList.remove("hidden");
      //     } else {
      //       const section = this.domMap.armature.section;
      //       section.body.classList.add("hidden");
      //     }
      //   },
      // );
    }
  }
}

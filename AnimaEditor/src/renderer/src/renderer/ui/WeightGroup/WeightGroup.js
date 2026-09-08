import { Model_Bone } from "../../../core/project/model/Bone.js";
import { Model_Sprite } from "../../../core/project/model/Sprite.js";
import { SetPropertyCommand } from "../../../editor/command/SetProperty.js";
import { EditorContext } from "../../../editor/Editor.js";
import { SpriteState } from "../../../editor/editorState/state/Sprite.js";
import { JTag } from "../../../library/JTag/JTag.js";
import { CustomTag } from "../../../library/JTag/tag/CustomTag.js";
import { JTag_DBInput } from "../../../library/JTag/tag/DBInput.js";
import { JTag_Label } from "../../../library/JTag/tag/Label.js";
import { JTag_List } from "../../../library/JTag/tag/list.js";
import { JTag_HierarchyNode } from "../../../library/JTag/tag/HierarchyNode.js";
import { JTag_Section } from "../../../library/JTag/tag/Section.js";
import { JTag_Select } from "../../../library/JTag/tag/Select.js";
import { JTag_Slider } from "../../../library/JTag/tag/slider.js";
import { UIComponent } from "../UI.js";
import { JTag_Container } from "../../../library/JTag/TAG/container.js";

let counter = 0;
export class UIComponent_WeightGroup extends UIComponent {
  constructor() {
    super({ name: "WeightGroup", id: counter });
    counter++;

    this.domMap = {
      Sprite: {},
      Bone: {},
    };

    /** @type {Function[]} */
    this.eventRemoveFunctions = [];
    this.observerRemoveDatas = [];
  }

  /**
   *
   * @param {EditorContext} editorContext
   * @param {CustomTag} parent
   */
  update(editorContext, parent) {
    const libraryJTag = editorContext.library.JTag;
    if (!parent.getElementByID("WeightGroup")) {
      libraryJTag.clear(parent);
      /** @type {JTag_Container} */
      const container = JTag.createTag("Container");
      container.body.classList.add("group-container");
      container.id = `Inspector`;
      libraryJTag.append(parent, container);
    }
  }
}

import { EditorContext } from "../../../editor/Editor.js";
import { JTag } from "../../../library/JTag/JTag.js";
import { JTag_Container } from "../../../library/JTag/TAG/container.js";
import { CustomTag } from "../../../library/JTag/tag/CustomTag.js";
import { JTag_Text } from "../../../library/JTag/tag/Text.js";
import { UIComponent } from "../UI.js";

let counter = 0;
export class UIComponent_Footer extends UIComponent {
  constructor() {
    super({ name: "Project", id: counter });
    counter++;

    this.body = null;
  }

  /**
   *
   * @param {EditorContext} editorContext
   * @param {CustomTag} parent
   */
  update(editorContext, parent) {
    const libraryJTag = editorContext.library.JTag;
    const id = `Footer-${this.id}`;
    if (!parent.children.length || parent.children[0].id !== id) {
      libraryJTag.clear(parent);

      /** @type {JTag_Container} */
      const container = JTag.createTag("Container");
      container.id = id;
      libraryJTag.append(parent, container);
    }
  }
}

import { AnimaEditor, ID } from "../../../editor/Editor";
import { JTag } from "../../../library/JTag/JTag";
import { JTag_CustomTag } from "../../../library/JTag/tag/CustomTag";
import { setActiveObjectOnClick, setPropertyOnInput, UIComponent } from "../UI";
import { JTag_Container } from "../../../library/JTag/tag/Container";
import { JTag_Base } from "../../../library/JTag/tag/Base";
import { JTag_Hierarchy } from "../../../library/JTag/tag/Hierarchy";
import { JTag_HierarchyNode } from "../../../library/JTag/tag/HierarchyNode";
import { JTag_Text } from "../../../library/JTag/tag/Text";
import { JTag_DBInput } from "../../../library/JTag/tag/DBInput";
import { CommandManager } from "../../../manager/CommandManager";
import { Models, Project } from "../../../core/project/Project";
import { JTag_SearchBar } from "../../../library/JTag/tag/SearchBar";
import { JTag_Button } from "../../../library/JTag/tag/Button";
import { EditorEvent, EditorEventType } from "../../../manager/EventManager";
import { UIManager } from "../../../manager/UIManager";
import { ContextManager } from "../../../manager/ContextManager";
import { Model_Sprite } from "../../../core/project/model/Sprite";
import { Model_Armature } from "../../../core/project/model/Armature";
import { Model_Animation } from "../../../core/project/model/Animation";
import { Model_Texture } from "../../../core/project/model/Texture";

let counter = 0;
export class UIComponent_Project extends UIComponent {
  public tagMap: Map<string, JTag_HierarchyNode>;
  public root: JTag_HierarchyNode | null;
  constructor() {
    super({ name: "Project", id: counter, icon: "hierarchy" });
    counter++;

    this.tagMap = new Map();
    this.root = null;
  }

  public override input(): void {
  }

  public override update(editor: AnimaEditor, parent: JTag_CustomTag): void {
    const libraryJTag = editor.library.JTag;
    const commandManager = editor.getManager(CommandManager);
    if (!commandManager) return ;
    const uiManager = editor.getManager(UIManager);
    if (!uiManager) return ;
    const contextManager = editor.getManager(ContextManager);
    if (!contextManager) return ;
    const activeObjectSourceContext = contextManager.activeObjectSourceContext;
    const projectSourceContext = contextManager.projectSourceContext;

    if (!parent.getElementByID("Project")) {
      libraryJTag.clear(parent);
      const container = JTag.createTag(JTag_Container);
      container.body.classList.add("group-container");
      container.id = `Project`;
      libraryJTag.append(parent, container);

      const header = JTag.createTag(JTag_Base);
      header.body.classList.add("header");

      const iconTag = JTag.createTag(JTag_Button);
      iconTag.setIcon(JTag.getSvg(this.icon));
      iconTag.setText(this.name);
      libraryJTag.append(header, iconTag);

      const searchBar = JTag.createTag(JTag_SearchBar);
      libraryJTag.append(header, searchBar);

      const loadBtn = JTag.createTag(JTag_Button);
      loadBtn.setIcon(JTag.getSvg("folder"));
      loadBtn.body.addEventListener("click", () => {
        editor.load();
      });
      libraryJTag.append(header, loadBtn);

      const kebabBtn = JTag.createTag(JTag_Button);
      kebabBtn.setIcon(JTag.getSvg("kebab"));
      kebabBtn.body.addEventListener("click", () => {
        editor.load();
      });
      libraryJTag.append(header, kebabBtn);

      const Hierarchy = JTag.createTag(JTag_Hierarchy);
      libraryJTag.append(container, header);
      libraryJTag.append(container, Hierarchy);

      const rootNode = JTag.createTag(JTag_HierarchyNode);
      rootNode.id = "Project";
      libraryJTag.append(Hierarchy, rootNode);
      const text = JTag.createTag(JTag_Text);
      text.setText("Project");
      text.body.classList.add("label");
      libraryJTag.append(rootNode, text);
      this.root = rootNode;

      const modelsMap = new Map();
      uiManager.addTagUpdater(
        UIManager.createTagUpdater({
          targetEvents: [
            new EditorEvent(EditorEventType.change, editor, "project"),
            new EditorEvent(EditorEventType.add, projectSourceContext, "models"),
            new EditorEvent(EditorEventType.delete, projectSourceContext, "models")
          ],
          tagMap: {root: rootNode},
          inputMap: {project: projectSourceContext, modelNodeMap: modelsMap},
          update: (input) => {
            if (!input.inputMap.project) return ;
            libraryJTag.clear(input.tagMap.root, 1);

            const modelsNode = JTag.createTag(JTag_HierarchyNode);
            modelsNode.id = "models";
            {
              const name = JTag.createTag(JTag_DBInput);
              name.setValue("models");
              name.body.classList.add("label");
              libraryJTag.append(modelsNode, name);
              libraryJTag.append(input.tagMap.root, modelsNode, 1);
            }

            const runtimesNode = JTag.createTag(JTag_HierarchyNode);
            runtimesNode.id = "runtimes";
            {
              const name = JTag.createTag(JTag_DBInput);
              name.setValue("runtimes");
              name.body.classList.add("label");
              libraryJTag.append(runtimesNode, name);
              libraryJTag.append(input.tagMap.root, runtimesNode, 1);
            }

            for (const modelType of [
              {type: Model_Sprite, name: "sprite"},
              {type: Model_Armature, name: "armature"},
              {type: Model_Animation, name: "animation"},
              {type: Model_Texture, name: "texture"},
            ]) {
              const models = input.inputMap.project.getModelsByType(modelType.type as any); // anyでエラーを消している
              const typesNode = JTag.createTag(JTag_HierarchyNode);
              typesNode.id = modelType.name;
              {
                const name = JTag.createTag(JTag_DBInput);
                name.setValue(modelType.name);
                name.body.classList.add("label");
                libraryJTag.append(typesNode, name);
                libraryJTag.append(modelsNode, typesNode, 1);
              }

              for (const model of models) {
                const modelNode = JTag.createTag(JTag_HierarchyNode);
                modelNode.hiddeToggle();
                modelNode.id = model.id;
                const name = JTag.createTag(JTag_DBInput);
                name.setValue(model.name);
                name.body.classList.add("label");
                libraryJTag.append(modelNode, name);

                setPropertyOnInput(commandManager, name, model as Models, "name");

                setActiveObjectOnClick(commandManager, modelNode, model as Models);

                libraryJTag.append(typesNode, modelNode, 1);
                input.inputMap.modelNodeMap.set(model.id, modelNode);
              }
            }
          },
        })
      );
      uiManager.addTagUpdater(
        UIManager.createTagUpdater({
          targetEvents: [
            new EditorEvent(EditorEventType.change, editor.editorState, "activeObject"),
          ],
          tagMap: {},
          inputMap: {activeObject: activeObjectSourceContext, modelNodeMap: modelsMap},
          update: (
            input: {
              tagMap: {},
              inputMap: {activeObject: Models | null, modelNodeMap: Map<ID, JTag_HierarchyNode>}
            }
          ) => {
            for (const [modelID, modelNode] of input.inputMap.modelNodeMap.entries()) {
              if (input.inputMap.activeObject?.id === modelID) {
                modelNode.body.classList.add("active");
              } else {
                modelNode.body.classList.remove("active");
              }
            }
          },
        })
      );
    }
  }
}

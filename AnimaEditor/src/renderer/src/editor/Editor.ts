import { ModelNames, Models, Project, ProjectInput } from "../core/project/Project";
import { System } from "../core/system/System";
import { UIManager } from "../manager/UIManager";
import { EditorState, States } from "./editorState/EditorState";
import { Model_Animation, Model_AnimationInput } from "../core/project/model/Animation";
import { Model_Sprite, Model_SpriteInput } from "../core/project/model/Sprite";
import { Model_Armature, Model_ArmatureInput } from "../core/project/model/Armature";
import { System_Sprite } from "../core/system/init/Sprite";
import { System_Armature } from "../core/system/init/Armature";
import { System_Runtime } from "../core/system/runtime/Runtime";
import { System_Animation } from "../core/system/animation/Animation";
import { Manager } from "../manager/Manager";
import { PipelineManager } from "../manager/PipelineManager";
import { CommandManager } from "../manager/CommandManager";
import { InputManager } from "../manager/InputManager";
import { ProjectCache, Runtimes } from "../core/projectCache/ProjectCache";
import { JTag } from "../library/JTag/JTag";
import { simpleWebGPU } from "../util/simpleWebGPU";
import { wgslShaderCodes } from "./wgslShaderCodes";
import { System_Texture } from "../core/system/init/Texture";
import { Model_Texture, Model_TextureInput } from "../core/project/model/Texture";
import { Observer } from "./Observer";
import { projectSave } from "./serialization/Save";
import { System_Bone } from "../core/system/animation/Bone";
import { System_Skinning } from "../core/system/animation/SkinningSystem";
import { projectLoad } from "./serialization/Load";
import { EditorAPI } from "./EditorAPI";
import { EventManager } from "../manager/EventManager";
import { ContextManager } from "../manager/ContextManager";
import { Runtime_Texture } from "../core/projectCache/runtime/Texture";
import { Runtime_Animation } from "../core/projectCache/runtime/Animation";
import { AnimationState } from "./editorState/state/Animation";
import { Runtime_Sprite } from "../core/projectCache/runtime/Sprite";
import { SpriteState } from "./editorState/state/Sprite";
import { Runtime_Armature } from "../core/projectCache/runtime/Armature";
import { ArmatureState } from "./editorState/state/Armature";
import { TextureState } from "./editorState/state/Texture";

export const rootPath: string = "src/";

export const createLocalPath = (path: string): string => {
  return `${rootPath}${path}`;
};

// simpleWebGPU.addImportSourceStruct(
//   await loadFile(
//     "./renderer/ui/view/renderPass/templates/struct/ViewCamera.wgsl",
//   ),
// );
simpleWebGPU.addImportSourceStruct(wgslShaderCodes["templates/struct/ViewCamera"]);
simpleWebGPU.addImportSourceFunction(wgslShaderCodes["templates/function/util"]);

export type ID = string;

export class AnimaEditor {
  public project: Project;
  public projectCache: ProjectCache;
  public systems: System[];
  public library: {
    JTag: JTag,
  };
  private managers: Manager[];
  private lastTime: number;
  public deltaTime: number;
  public editorState: EditorState;
  public observer: Observer;

  public api: EditorAPI;

  constructor() {
    this.project = new Project({ sceneConfig: {projectName: "初期プロジェクト"}, animationConfig: {frameStart: 0, frameEnd: 20, frameSpeed: 0.1} });
    this.projectCache = new ProjectCache(this.project);
    this.systems = [
      new System_Texture(this),
      new System_Sprite(this),
      new System_Armature(this),
      new System_Runtime(this),
      new System_Animation(this),
      new System_Bone(this),
      new System_Skinning(this),
    ];

    this.library = {
      JTag: new JTag(),
    };

    this.managers = [
      new ContextManager(this),
      new EventManager(this),
      new PipelineManager(this),
      new UIManager(this),
      new InputManager(this),
      new CommandManager(this),
    ]

    this.lastTime = 0;

    this.deltaTime = 0;

    this.editorState = new EditorState();

    this.observer = new Observer();

    this.api = new EditorAPI(this);
  }

  createProject(data: ProjectInput) {
    return new Project(data);
  }

  load() {
    projectLoad(this);
  }

  save() {
    projectSave(this);
  }

  createModel(data: Model_AnimationInput | Model_ArmatureInput | Model_TextureInput | Model_SpriteInput): {model: Models | null, runtime: Runtimes | null, state: States | null} {
    if (data.modelName === ModelNames.Sprite) return this.addSprite(data);
    else if (data.modelName === ModelNames.Aramature) return this.addArmature(data);
    else if (data.modelName === ModelNames.Animation) return this.addAnimation(data);
    else if (data.modelName === ModelNames.Texture) return this.addTexture(data);
    return {model: null, runtime: null, state: null};
  }

  addTexture(data: Model_TextureInput): {model: Model_Texture, runtime: Runtime_Texture, state: TextureState} {
    const model = this.project.createTexture(data);
    const runtime = this.projectCache.addTexture(model);
    const state = this.editorState.addTexture(model);
    return {model, runtime, state};
  }
  addAnimation(data: Model_AnimationInput): {model: Model_Animation, runtime: Runtime_Animation, state: AnimationState} {
    const model = this.project.createAnimation(data);
    const runtime = this.projectCache.addAnimation(model);
    const state = this.editorState.addAnimation(model);
    return {model, runtime, state};
  }
  addSprite(data: Model_SpriteInput): {model: Model_Sprite, runtime: Runtime_Sprite, state: SpriteState} {
    const model = this.project.createSprite(data);
    const runtime = this.projectCache.addSprite(model);
    const state = this.editorState.addSprite(model);
    return {model, runtime, state};
  }
  addArmature(data: Model_ArmatureInput): {model: Model_Armature, runtime: Runtime_Armature, state: ArmatureState} {
    const model = this.project.createArmature(data);
    const runtime = this.projectCache.addArmature(model);
    const state = this.editorState.addArmature(model);
    return {model, runtime, state};
  }

  getManager<T extends Manager>(Manager: new (...args: any[]) => T): T | null {
    for (const manager of this.managers) {
      if (manager instanceof Manager) return manager;
    }
    return null;
  }

  update() {
    for (const manager of this.managers) {
      if (manager.update) manager.update();
    }
    for (const system of this.systems) {
      system.update();
    }
    for (const manager of this.managers) {
      if (manager.updateLate) manager.updateLate();
    }
    this.observer.update();
  }

  private loop(timestamp: number): void {
    this.deltaTime = (timestamp - this.lastTime) / 1000; // 秒単位
    this.lastTime = timestamp;

    this.update();
    requestAnimationFrame((t) => this.loop(t));
  }

  async start() {
    const pipelineManager = this.getManager(PipelineManager);
    if (!pipelineManager) return ;
    pipelineManager.addPipeline(
      "Bacground-Grid",
      pipelineManager.createRenderPipeline(
        wgslShaderCodes["view/background/Grid"],
        {
          vertexBuffers: [],
        },
      ),
    );
    pipelineManager.addPipeline(
      "Overlay-Armature",
      pipelineManager.createRenderPipeline(
        wgslShaderCodes["view/overlay/Armature"],
        {
          vertexBuffers: [{ location: 0, source: "VERTEX" }],
        },
      ),
    );
    pipelineManager.addPipeline(
      "Overlay-ArmatureVertex",
      pipelineManager.createRenderPipeline(
        wgslShaderCodes["view/overlay/ArmatureVertex"],
        {
          vertexBuffers: [],
        },
      ),
    );
    pipelineManager.addPipeline(
      "Scene-Sprite",
      pipelineManager.createRenderPipeline(
        wgslShaderCodes["view/scene/Sprite"],
        {
          vertexBuffers: [
            { location: 0, source: "VERTEX" },
            { location: 1, source: "TEXCOORD" },
          ],
        },
      ),
    );
    pipelineManager.addPipeline(
      "Overlay-SpriteVertex",
      pipelineManager.createRenderPipeline(
        wgslShaderCodes["view/overlay/SpriteVertex"],
        {
          vertexBuffers: [],
        },
      ),
    );
    pipelineManager.addPipeline(
      "Overlay-SpriteEdge",
      pipelineManager.createRenderPipeline(
        wgslShaderCodes["view/overlay/SpriteEdge"],
        {
          vertexBuffers: [],
        },
      ),
    );
    pipelineManager.addPipeline(
      "Overlay-SpriteIndices",
      pipelineManager.createRenderPipeline(
        wgslShaderCodes["view/overlay/SpriteIndices"],
        {
          vertexBuffers: [],
        },
      ),
    );
    pipelineManager.addPipeline(
      "Overlay-Tool_TranslateOverlay",
      pipelineManager.createRenderPipeline(
        wgslShaderCodes["view/tool/translate/Overlay"],
        {
          vertexBuffers: [],
        },
      ),
    );
    pipelineManager.addPipeline(
      "Overlay-Tool_RotationOverlay",
      pipelineManager.createRenderPipeline(
        wgslShaderCodes["view/tool/rotation/Overlay"],
        {
          vertexBuffers: [],
        },
      ),
    );
    pipelineManager.addPipeline(
      "ObjectID-Sprite",
      pipelineManager.createRenderPipeline(
        wgslShaderCodes["view/objectID/Sprite"],
        {
          vertexBuffers: [
            { location: 0, source: "VERTEX" },
            { location: 1, source: "TEXCOORD" },
          ],
        },
      ),
    );
    pipelineManager.addPipeline(
      "ObjectID-Armature",
      pipelineManager.createRenderPipeline(
        wgslShaderCodes["view/objectID/Armature"],
        {
          vertexBuffers: [{ location: 0, source: "VERTEX" }],
        },
      ),
    );

    for (const system of this.systems) {
      if (system.start) system.start();
    }
    for (const manager of this.managers) {
      if (manager.start) manager.start();
    }
    requestAnimationFrame((t) => {
      this.lastTime = t; // 初回は deltaTime = 0 にする
      this.loop(t);
    });
  }
}

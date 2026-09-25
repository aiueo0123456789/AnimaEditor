import { Model_Animation } from "../../../core/project/model/Animation";
import { Model_Armature } from "../../../core/project/model/Armature";
import { Model_Sprite } from "../../../core/project/model/Sprite";
import type { AnimaEditor } from "../../../editor/Editor";
import { AnimationState } from "../../../editor/editorState/state/States/Animation";
import { UIManager } from "../../../manager/ui/UIManager";
import type { WidgetHandle } from "../../../manager/ui/WidgetTree";
import { bind, Timeline } from "../../../manager/ui/components";
import type { TimelineData, TimelineKind } from "../../../manager/ui/components";
import { UIComponent } from "../UI";
import { UIComponent_Timeline_SpaceData } from "./SpaceData";

export class UIComponent_Timeline extends UIComponent {
  private handle: WidgetHandle | null = null;
  private host: HTMLElement | null = null;

  constructor(public readonly spaceData = new UIComponent_Timeline_SpaceData()) { super({ name: "Timeline", id: 0, icon: "play" }); }
  public override input(): void {}

  public override dispose(editor: AnimaEditor): void {
    if (this.handle) editor.getManager(UIManager)?.disposeWidget(this.handle);
    this.handle = null;
    this.host = null;
  }

  private readData(editor: AnimaEditor): TimelineData {
    const config = editor.project.animationConfig;
    const runtime = editor.projectCache.sceneConfig;
    return {
      frameStart: config.frameStart, frameEnd: config.frameEnd,
      currentFrame: runtime.currentFrame, playing: runtime.isPlay,
      tracks: editor.project.getModelsByType(Model_Animation).map(animation => {
        const reference = animation.targetID;
        const target = editor.project.getModelByID("modelID" in reference ? reference.modelID : reference.aramatureID);
        const kind: TimelineKind = target instanceof Model_Armature ? "armature" : target instanceof Model_Sprite ? "sprite" : "other";
        const state = editor.editorState.getModelStateByID(animation.id);
        return {
          id: animation.id, label: animation.name, kind,
          keyframes: animation.keyframes.map(key => ({
            id: key.id, frame: key.frame,
            selected: state instanceof AnimationState && state.selectKeyframeIDs.includes(key.id),
          })),
        };
      }),
    };
  }

  public override update(editor: AnimaEditor, parent: HTMLElement): void {
    const ui = editor.getManager(UIManager);
    if (!ui) return;
    if (this.host !== parent || !this.handle) {
      this.dispose(editor);
      this.handle = ui.mountWidget(parent, Timeline({
        viewState: this.spaceData,
        data: bind({ read: () => this.readData(editor) }),
        onPlay: playing => editor.api.setProperty(editor.projectCache, "sceneConfig.isPlay", playing),
        onSeek: frame => {
          editor.api.setProperty(editor.projectCache, "sceneConfig.isPlay", false);
          editor.api.setProperty(editor.projectCache, "sceneConfig.currentFrame", frame);
        },
        onSelectKeyframe: (trackID, keyframeID, additive) => {
          const target = editor.project.getModelByID(trackID);
          if (!(target instanceof Model_Animation) || !target.keyframes.some(key => key.id === keyframeID)) return;
          for (const animation of editor.project.getModelsByType(Model_Animation)) {
            const state = editor.editorState.getModelStateByID(animation.id);
            if (!(state instanceof AnimationState)) continue;
            let ids = additive ? [...new Set(state.selectKeyframeIDs)].filter(id => animation.keyframes.some(key => key.id === id)) : [];
            if (animation.id === trackID) {
              ids = additive && ids.includes(keyframeID) ? ids.filter(id => id !== keyframeID) : [...ids, keyframeID];
            }
            editor.api.setProperty(state, "selectKeyframeIDs", ids);
            const activeID = animation.id === trackID && ids.includes(keyframeID) ? keyframeID
              : ids.includes(state.activeKeyframeID) ? state.activeKeyframeID : ids.at(-1) ?? "";
            editor.api.setProperty(state, "activeKeyframeID", activeID);
          }
        },
      }));
      this.host = parent;
    }
    // Playback is updated by the animation system, including changes without events.
    // UIManager still owns the flush; the control patches only the changing frame.
    ui.invalidateWidget(this.handle);
  }
}

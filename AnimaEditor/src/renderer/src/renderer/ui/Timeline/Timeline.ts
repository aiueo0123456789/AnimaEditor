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
import { CommandManager } from "../../../manager/CommandManager";
import { commitUIProperties } from "../../../manager/ui/commands";
import type { PropertyEdit } from "../../../editor/command/interactionCommand/SetPropertiesCommand";

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
    const animations = editor.project.getModelsByType(Model_Animation);
    const groups = animations.map(animation => {
      const kinds: TimelineKind[] = [];
      if (editor.project.getModelsByType(Model_Armature).some(model => model.animation.animationID === animation.id)) kinds.push("armature");
      if (editor.project.getModelsByType(Model_Sprite).some(model => model.animation.animationID === animation.id)) kinds.push("sprite");
      if (!kinds.length) kinds.push("other");
      return { id: animation.id, label: animation.name, kind: kinds[0], kinds };
    });
    return {
      groups,
      frameStart: config.frameStart, frameEnd: config.frameEnd,
      currentFrame: runtime.currentFrame, playing: runtime.isPlay,
      tracks: animations.flatMap((animation, index) => {
        const group = groups[index];
        const state = editor.editorState.getModelStateByID(animation.id);
        return Object.entries(animation.tracks).map(([trackID, track]) => ({
          id: JSON.stringify([animation.id, trackID]), label: track.name, kind: group.kind, kinds: group.kinds,
          group,
          keyframes: track.keyframes.map(key => ({
            id: key.id, frame: key.frame,
            selected: state instanceof AnimationState && state.selectKeyframeIDs.includes(key.id),
          })),
        }));
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
          const commands = editor.getManager(CommandManager);
          if (!commands || commands.commandRecorder) return;
          const animations = editor.project.getModelsByType(Model_Animation);
          const target = animations.find(animation => Object.entries(animation.tracks).some(([id, track]) =>
            JSON.stringify([animation.id, id]) === trackID && track.keyframes.some(key => key.id === keyframeID)));
          if (!target) return;
          const edits: PropertyEdit[] = [];
          for (const animation of animations) {
            const state = editor.editorState.getModelStateByID(animation.id);
            if (!(state instanceof AnimationState)) continue;
            const validKeys = new Set(Object.values(animation.tracks).flatMap(track => track.keyframes.map(key => key.id)));
            let ids = additive ? [...new Set(state.selectKeyframeIDs)].filter(id => validKeys.has(id)) : [];
            if (animation === target) {
              ids = additive && ids.includes(keyframeID) ? ids.filter(id => id !== keyframeID) : [...ids, keyframeID];
            }
            edits.push({ model: state, path: "selectKeyframeIDs", value: ids });
            const activeID = animation === target && ids.includes(keyframeID) ? keyframeID
              : ids.includes(state.activeKeyframeID) ? state.activeKeyframeID : ids.at(-1) ?? "";
            edits.push({ model: state, path: "activeKeyframeID", value: activeID });
          }
          commitUIProperties(commands, "Select keyframe", edits);
        },
      }));
      this.host = parent;
    }
    // Playback is updated by the animation system, including changes without events.
    // UIManager still owns the flush; the control patches only the changing frame.
    ui.invalidateWidget(this.handle);
  }
}

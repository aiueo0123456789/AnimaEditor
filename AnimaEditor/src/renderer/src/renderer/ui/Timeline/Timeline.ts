import { Model_Animation } from "../../../core/project/model/Animation";
import { AnimaEditor } from "../../../editor/Editor";
import { AnimationState } from "../../../editor/editorState/state/Animation";
import { JTag } from "../../../library/JTag/JTag";
import { JTag_Base } from "../../../library/JTag/tag/Base";
import { JTag_Button } from "../../../library/JTag/tag/Button";
import { JTag_Column } from "../../../library/JTag/tag/Column";
import { JTag_Container } from "../../../library/JTag/tag/Container";
import { JTag_CustomTag } from "../../../library/JTag/tag/CustomTag";
import { InputManager } from "../../../manager/InputManager";
import { UIComponent } from "../UI";

class ViewData {
  public zoom: number;
  public scrollX: number;
  public scrollY: number;
  constructor() {
    this.zoom = 20;
    this.scrollX = 0;
    this.scrollY = 0;
  }
}

enum TimelineState {
  STAND = 0,
  TRANSFORM = 1,
  MOVE_FRAME = 2,
}

let counter = 0;
export class UIComponent_Timeline extends UIComponent {
  public viewData: ViewData;
  public state: TimelineState;
  constructor() {
    super({ name: "Timeline", id: counter });
    counter++;

    this.viewData = new ViewData();

    this.state = TimelineState.STAND;
  }

  public override input(input: InputManager, editor: AnimaEditor): void {
    if (this.state === TimelineState.MOVE_FRAME) {
      editor.projectCache.sceneConfig.currentFrame += input.mouseMovement[0] / this.viewData.zoom;
    } else {
      this.viewData.scrollX -= input.mouseScrollDelta[0] / this.viewData.zoom;
    }
    // } else if (this.state === "move_keyframe") {
    //   for (const animation of editorContext.project.animations) {
    //     /** @type {AnimationState} */
    //     const state = editorContext.editorState.getModelStateByID(animation.id);
    //     for (const keyframe of animation.keyframes) {
    //       if (state.selectKeyframeIDs.includes(keyframe.id)) {
    //         keyframe.frame += input.mouseMovement[0] / this.viewData.zoom;
    //       }
    //     }
    //   }
  }

  public override update(editor: AnimaEditor, parent: JTag_CustomTag) {
    const libraryJTag = editor.library.JTag;
    if (!parent.getElementByID("Timeline")) {
      const setEventDragAndDropElement = (tag, state) => {
        tag.body.addEventListener("mousedown", () => {
          this.state = state;
          const stateCloseFn = () => {
            this.state = TimelineState.STAND;
            document.removeEventListener("mouseup", stateCloseFn);
          };
          document.addEventListener("mouseup", stateCloseFn);
        });
      };

      libraryJTag.clear(parent);
      const container = JTag.createTag(JTag_Container);
      container.body.classList.add("timeline");
      container.body.classList.add("group-container");
      container.id = `Timeline`;

      const header = JTag.createTag(JTag_Base);
      header.body.classList.add("header");

      const controls = JTag.createTag(JTag_Base);
      controls.body.classList.add("controls");

      const playBtn = JTag.createTag(JTag_Button);
      playBtn.body.addEventListener("click", () => {
        editor.projectCache.sceneConfig.isPlay = !editor.projectCache.sceneConfig.isPlay;
      })
      editor.observer.add(
        {
          object: editor.projectCache.sceneConfig,
          property: "isPlay",
        },
        (current: boolean, last, isInit) => {
          if (current) playBtn.setIcon(JTag.getSvg("stop"));
          else playBtn.setIcon(JTag.getSvg("play"));
        },
        true,
      );

      const frameDisplay = JTag.createTag(JTag_Base);
      frameDisplay.body.classList.add("frameDisplay");
      libraryJTag.append(header, controls);
      libraryJTag.append(container, playBtn);
      libraryJTag.append(header, frameDisplay);

      const body = JTag.createTag(JTag_Column);
      body.body.classList.add("body");
      body.body.classList.add("main");

      libraryJTag.append(parent, container);
      libraryJTag.append(container, header);
      libraryJTag.append(container, body);

      const trackLabels = JTag.createTag(JTag_Container);
      trackLabels.body.classList.add("timeline-body-trackLabels");
      const timeline = JTag.createTag(JTag_Container);
      timeline.body.classList.add("timeline-body");

      const ruler = JTag.createTag(JTag_Base);
      ruler.body.classList.add("timeline-body-ruler");

      const tracks = JTag.createTag(JTag_Base);
      tracks.body.classList.add("timeline-body-tracks");

      const playhead = JTag.createTag(JTag_Base);
      playhead.body.classList.add("timeline-body-playhead");

      const handle = JTag.createTag(JTag_Base);
      handle.body.classList.add("timeline-body-playhead-handle");
      setEventDragAndDropElement(handle, TimelineState.MOVE_FRAME);

      libraryJTag.append(body, trackLabels, 0);
      libraryJTag.append(body, timeline, 1);
      libraryJTag.append(timeline, ruler);
      libraryJTag.append(timeline, tracks);
      libraryJTag.append(timeline, playhead);
      libraryJTag.append(playhead, handle);

      /** @type {{frame: number, tag: JTag_Base }[]} */
      const tickTags = [];

      /** @type {{keyframe: any, tag: JTag_Base }[]} */
      const keyframeTags = [];

      const updatePlayhead = () => {
        playhead.body.style.left = `${(editor.projectCache.sceneConfig.currentFrame - this.viewData.scrollX) * this.viewData.zoom}px`;
      }

      editor.observer.add(
        {
          object: editor.projectCache.sceneConfig,
          property: "currentFrame",
        },
        (current, last, isInit) => {
          updatePlayhead();
          frameDisplay.body.textContent = `${current}`;
        },
        true,
      );

      const selectFlagClearForAllKeframes = () => {
        for (const animation of editor.project.getModelsByType(Model_Animation)) {
          const animationState = editor.editorState.getModelStateByID(animation.id);
          if (animationState instanceof AnimationState) animationState.selectKeyframeIDs.length = 0;
        }
      };

      editor.observer.add(
        {
          object: editor.project,
          property: "models",
        },
        (current, last, isInit) => {
          const animations = editor.project.getModelsByType(Model_Animation);
          libraryJTag.clear(trackLabels);
          libraryJTag.clear(tracks);
          for (const animation of animations) {
            /** @type {JTag_Base} */
            const trackLabel = JTag.createTag(JTag_Base);
            trackLabel.body.classList.add(
              "timeline-body-trackLabels-trackLabel",
            );
            trackLabel.body.textContent = animation.name;
            libraryJTag.append(trackLabels, trackLabel);

            const timelineTrack = JTag.createTag(JTag_Base);
            timelineTrack.body.classList.add("timelineTrack");
            libraryJTag.append(tracks, timelineTrack);

            /** @type {AnimationState} */
            const animationState = editor.editorState.getModelStateByID(
              animation.id,
            );

            const localKeyframeTags = new Map();

            editor.observer.add(
              { object: animation, property: "keyframes" },
              (current, last, isInit) => {
                for (const keyframe of current) {
                  const tag_keyframe = JTag.createTag(JTag_Base);
                  tag_keyframe.body.classList.add("keyframe");
                  setEventDragAndDropElement(tag_keyframe, "move_keyframe");
                  editor.observer.add(
                    { object: keyframe, property: "frame" },
                    (current, last, isInit) => {
                      tag_keyframe.body.style.left = `${(current - this.viewData.scrollX) * this.viewData.zoom}px`;
                    },
                  );
                  keyframeTags.push({
                    keyframe: keyframe,
                    tag: tag_keyframe,
                  });
                  localKeyframeTags.set(keyframe.id, {
                    keyframe: keyframe,
                    tag: tag_keyframe,
                  });
                  tag_keyframe.body.addEventListener("mousedown", () => {
                    selectFlagClearForAllKeframes();
                    if (
                      animationState.selectKeyframeIDs.includes(keyframe.id)
                    ) {
                      animationState.selectKeyframeIDs.splice(
                        animationState.selectKeyframeIDs.indexOf(keyframe.id),
                        1,
                      );
                    } else {
                      animationState.selectKeyframeIDs.push(keyframe.id);
                    }
                  });
                  libraryJTag.append(timelineTrack, tag_keyframe);
                }
              },
              true,
            );

            editor.observer.add(
              {
                object: animationState,
                property: "selectKeyframeIDs",
              },
              (current, last, isInit) => {
                if (last) {
                  // 選択解除
                  const diff = last.filter((item) => !current.includes(item));
                  for (const keyframeID of diff) {
                    localKeyframeTags
                      .get(keyframeID)
                      .tag.body.classList.remove("selected");
                  }
                }
                for (const keyframeID of current) {
                  localKeyframeTags
                    .get(keyframeID)
                    .tag.body.classList.add("selected");
                }
              },
              true,
            );
          }
        },
        true,
      );

      const updateTicks = () => {
        libraryJTag.clear(ruler);
        for (
          let frame = editor.project.animationConfig.frameStart;
          frame < editor.project.animationConfig.frameEnd;
          frame += 5
        ) {
          const tag_tick = JTag.createTag(JTag_Base);
          tag_tick.body.classList.add("timeline-body-ruler-tick");
          tag_tick.body.textContent = `${frame}`;
          libraryJTag.append(ruler, tag_tick);
          tickTags.push({ frame: frame, tag: tag_tick });
        }
      };

      const updateFn = () => {
        for (const tickTag of tickTags) {
          tickTag.tag.body.style.left = `${(tickTag.frame - this.viewData.scrollX) * this.viewData.zoom}px`;
        }
        for (const keyframeTag of keyframeTags) {
          keyframeTag.tag.body.style.left = `${(keyframeTag.keyframe.frame - this.viewData.scrollX) * this.viewData.zoom}px`;
        }
        updatePlayhead();
      };
      editor.observer.add(
        {
          object: editor.project.animationConfig,
          property: "frameStart",
        },
        updateTicks,
        true,
      );
      editor.observer.add(
        {
          object: editor.project.animationConfig,
          property: "frameEnd",
        },
        updateTicks,
        true,
      );
      editor.observer.add(
        { object: this.viewData, property: "zoom" },
        updateFn,
        true,
      );
      editor.observer.add(
        { object: this.viewData, property: "scrollX" },
        updateFn,
        true,
      );
      editor.observer.add(
        { object: this.viewData, property: "scrollY" },
        updateFn,
        true,
      );

      // <div class="header">
      //   <div class="controls">...JTag_Buttonなど...</div>
      //   <div class="frameDisplay">Frame 42 / 240</div>
      // </div>
      // <div class="body">
      //   <div class="trackLabels">
      //     <div class="trackLabel">Bone.head</div>
      //     <div class="trackLabel">Bone.arm_L</div>
      //   </div>
      //   <div class="scrollArea">
      //     <div class="ruler">
      //       <div class="tick" style="left: 0px">0</div>
      //       <div class="tick" style="left: 50px">10</div>
      //       <div class="tick" style="left: 100px">20</div>
      //       <div class="tick" style="left: 150px">30</div>
      //     </div>
      //     <div class="tracks">
      //       <div class="timelineTrack">
      //         <div class="keyframe" style="left: 40px"></div>
      //         <div class="keyframe selected" style="left: 80px"></div>
      //       </div>
      //     </div>
      //     <div class="playhead" style="left: 40px">
      //       <div class="handle"></div>
      //     </div>
      //   </div>
      // </div>
    }
    // this.viewData.scrollX = Math.sin(Date.now() / 400) * 10;
    // this.viewData.scrollX = -10;
    // this.viewData.zoom = (Math.sin(Date.now() / 400) + 1) * 10;
    this.viewData.zoom = 10;
  }
}

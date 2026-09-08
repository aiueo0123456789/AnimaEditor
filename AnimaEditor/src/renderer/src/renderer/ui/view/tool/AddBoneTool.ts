import { Model_Armature, Model_Bone } from "../../../../core/project/model/Armature";
import { Model_Sprite } from "../../../../core/project/model/Sprite";
import { ConcatArrayCommand } from "../../../../editor/command/ConcatArray";
import { PushElementCommand } from "../../../../editor/command/PushElement";
import { AnimaEditor, ID } from "../../../../editor/Editor";
import { ArmatureState } from "../../../../editor/editorState/state/Armature";
import { CommandManager, CommandRecorder } from "../../../../manager/CommandManager";
import { InputManager } from "../../../../manager/InputManager";
import { PipelineManager } from "../../../../manager/PipelineManager";
import { simpleWebGPU } from "../../../../util/simpleWebGPU";
import { Vec2, Vec2Math } from "../../../../util/vecMath";
import { UIComponent_View } from "../View";
import { Tool } from "./Tool";

export class AddBoneTool extends Tool {
  private parentID: ID[];
  private headPoints: Vec2[];
  private localTailPos: Vec2;
  private newBones: Model_Bone[];
  private commandRecorder: CommandRecorder | null;
  private addBoneCommand: ConcatArrayCommand | null;
  constructor() {
    super();
    this.parentID = [];
    this.headPoints = [];
    this.localTailPos = Vec2Math.create();

    this.newBones = [];

    this.commandRecorder = null;
    this.addBoneCommand = null;
  }

  public override activate(): void {
  }

  public override deactivate(): void {
  }

  public override update(editor: AnimaEditor, view: UIComponent_View): void {
    const inputManager = editor.getManager(InputManager);
    const commandManager = editor.getManager(CommandManager);
    if (!inputManager || !commandManager) return ;

    const activeObject = editor.editorState.activeObject;
    if (!activeObject) return ;
    const modelState = editor.editorState.getModelStateByID(activeObject.id);
    if (!modelState) return ;

    const mouseScreenPosition = view.clientToWorld(inputManager.mousePosition);

    if (!(activeObject instanceof Model_Armature) || !(modelState instanceof ArmatureState)) return ;

    if (inputManager.getKeyDown("Mouse0")) {
      this.commandRecorder = commandManager.createCommandRecorder();
      this.parentID = modelState.selectedTail.concat(modelState.selectedHead).map(parentIndex => activeObject.bones[parentIndex].id);
      this.headPoints = modelState.selectedTail.map(tailIndex => activeObject.bones[tailIndex].tail).concat(modelState.selectedHead.map(headIndex => activeObject.bones[headIndex].head));

      if (this.headPoints.length === 0) {
        this.parentID.push("");
        this.headPoints.push(Vec2Math.copy(mouseScreenPosition));
      }

      Vec2Math.clear(this.localTailPos);

      this.newBones = this.headPoints.map((head, i) => Model_Armature.createBone({
        name: "ボーン",
        head: Vec2Math.copy(head),
        tail: Vec2Math.copy(head),
        parentID: {
          aramatureID: activeObject.id,
          boneID: this.parentID[i],
        }
      }));

      this.addBoneCommand = commandManager.createCommand(ConcatArrayCommand);
      this.addBoneCommand.set(
        activeObject,
        "bones",
        this.newBones
      );
      this.commandRecorder.appendCommand(this.addBoneCommand);
    }

    Vec2Math.add(this.localTailPos, view.clientVecToWorldVec(inputManager.mouseMovement), this.localTailPos);

    if (!this.commandRecorder || !this.newBones || !this.addBoneCommand) return ;

    if (inputManager.getKey("Mouse0")) {
      this.newBones.forEach(bone => Vec2Math.add(bone.head, this.localTailPos, bone.tail));
    }

    if (inputManager.getKeyUp("Mouse0")) {
      commandManager.appendCommandRecorder(this.commandRecorder);
    }
  }

  public override drawOverlay(editor: AnimaEditor, view: UIComponent_View, renderPass: GPURenderPassEncoder): void {
    const pipelineManager = editor.getManager(PipelineManager);
    if (!pipelineManager) return ;
    const translateOverlayPipeline = pipelineManager.getPipelineByID(
      "Overlay-Tool_TranslateOverlay",
    );
    if (translateOverlayPipeline) {
      renderPass.setBindGroup(
        0,
        simpleWebGPU.createGroup(translateOverlayPipeline.groupLayout, [
          view.spaceData.cameraRenderData.cameraBuffer,
        ]),
      );
      renderPass.setPipeline(translateOverlayPipeline.pipeline);
      renderPass.draw(4, 1, 0);
    } else {
      console.warn("パイプライン: Overlay-Tool_TranslateOverlay がありません")
    }
  }
}

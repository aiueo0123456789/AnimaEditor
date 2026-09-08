import { Model_Armature } from "../../../../core/project/model/Armature";
import { Model_Sprite } from "../../../../core/project/model/Sprite";
import { ClearCommand, ClearCommandInput } from "../../../../editor/command/Clear";
import { ConcatArrayCommand, ConcatArrayCommandInput, ConcatArrayCommandUpdate } from "../../../../editor/command/ConcatArray";
import { PushElementCommand, PushElementCommandInput } from "../../../../editor/command/PushElement";
import { AnimaEditor } from "../../../../editor/Editor";
import { ArmatureState } from "../../../../editor/editorState/state/Armature";
import { SpriteState } from "../../../../editor/editorState/state/Sprite";
import { CommandManager, CommandRecorder } from "../../../../manager/CommandManager";
import { InputManager } from "../../../../manager/InputManager";
import { Vec2, Vec2Math } from "../../../../util/vecMath";
import { UIComponent_View } from "../View";
import { Tool } from "./Tool";

export class SelectTool extends Tool {
  private dragging: boolean;
  private startMousePos: Vec2;

  private commandRecorder: CommandRecorder | null;

  constructor() {
    super();
    this.dragging = false;
    this.startMousePos = Vec2Math.create();

    this.commandRecorder = null;
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

    const isSprite = activeObject instanceof Model_Sprite && modelState instanceof SpriteState;
    const isAramature = activeObject instanceof Model_Armature && modelState instanceof ArmatureState;

    const mouseWorldPosition = view.clientToWorld(inputManager.mousePosition);
    if (inputManager.getKeyDown("Mouse0")) {
      this.dragging = false;
      this.commandRecorder = commandManager.setCommandRecorder();
      if (!this.commandRecorder) return ;
      Vec2Math.copy(mouseWorldPosition, this.startMousePos);
      if (!inputManager.getKey("ShiftLeft")) {
        if (isSprite) {
          // 選択を解除
          this.commandRecorder.setCommand(ClearCommand, {
            model: modelState,
            path: "selectedVertexIndices"
          } as ClearCommandInput);
          this.commandRecorder.finishCommand();
        } else if (isAramature) {
          // ヘッド・テールの選択を解除
          this.commandRecorder.setCommand(ClearCommand, {
            model: modelState,
            path: "selectedHead"
          } as ClearCommandInput);
          this.commandRecorder.finishCommand();
          this.commandRecorder.setCommand(ClearCommand, {
            model: modelState,
            path: "selectedTail"
          } as ClearCommandInput);
          this.commandRecorder.finishCommand();
        }
      }
    }

    if (!this.commandRecorder) return ;

    if (!this.dragging && inputManager.dragging) {
      // 範囲選択に切り替え
      this.dragging = true;
      console.log("複数選択");
    }

    if (this.dragging) { // 範囲選択
      if (inputManager.getKey("Mouse0")) {
        if (activeObject instanceof Model_Sprite && modelState instanceof SpriteState) {
          if (!(this.commandRecorder.command instanceof ConcatArrayCommand)) {
            this.commandRecorder.setCommand(ConcatArrayCommand, {
              model: modelState,
              path: "selectedVertexIndices",
              newElements: [],
            } as ConcatArrayCommandInput);
            this.commandRecorder.finishCommand();
          }
          let selectVertices: number[] = [];
          for (let vi = 0; vi < activeObject.verticesNum; vi++) {
            const vertex = activeObject.vertices[vi];
            const min = Vec2Math.min(this.startMousePos, mouseWorldPosition);
            const max = Vec2Math.max(this.startMousePos, mouseWorldPosition);
            if (
              min[0] < vertex.co[0] &&
              min[1] < vertex.co[1] &&
              max[0] > vertex.co[0] &&
              max[1] > vertex.co[1]
            ) {
              selectVertices.push(vi);
            }
          }
          this.commandRecorder.updateCommand({newElements: selectVertices} as ConcatArrayCommandUpdate);
        } else if (activeObject instanceof Model_Armature && modelState instanceof ArmatureState) {
        }
      }
      if (inputManager.getKeyUp("Mouse0")) {
        commandManager.finishCommandRecorder();
        this.commandRecorder = null;
      }
    } else {
      if (inputManager.getKeyUp("Mouse0")) {
        if (activeObject instanceof Model_Sprite && modelState instanceof SpriteState) {
          let closestVertexDist = Infinity;
          let closestVertexIndex = -1;
          for (let vi = 0; vi < activeObject.verticesNum; vi++) {
            const vertex = activeObject.vertices[vi];
            const dist = Vec2Math.distance(
              vertex.co,
              mouseWorldPosition,
            );
            if (dist < closestVertexDist) {
              closestVertexIndex = vi;
              closestVertexDist = dist;
            }
          }
          if (closestVertexIndex !== -1) {
            this.commandRecorder.setCommand(PushElementCommand, {
              model: modelState,
              path: "selectedVertexIndices",
              newElement: closestVertexIndex
            } as PushElementCommandInput);
            this.commandRecorder.finishCommand();
            commandManager.finishCommandRecorder();
          }
        } else if (activeObject instanceof Model_Armature && modelState instanceof ArmatureState) {
          let closestVertexDist = Infinity;
          let closestVertexKind: "head" | "tail" = "head";
          let closestBoneIndex = -1;
          for (let bi = 0; bi < activeObject.bones.length; bi++) {
            const bone = activeObject.bones[bi];
            const headDist = Vec2Math.distance(bone.head, mouseWorldPosition);
            const tailDist = Vec2Math.distance(bone.tail, mouseWorldPosition);
            if (tailDist < headDist) {
              if (tailDist < closestVertexDist) {
                closestBoneIndex = bi;
                closestVertexKind = "tail";
                closestVertexDist = tailDist;
              }
            } else {
              if (headDist < closestVertexDist) {
                closestBoneIndex = bi;
                closestVertexKind = "head";
                closestVertexDist = headDist;
              }
            }
          }
          if (closestBoneIndex !== -1) {
            this.commandRecorder.setCommand(PushElementCommand, {
              model: modelState,
              path: closestVertexKind === "head" ? "selectedHead" : "selectedTail",
              newElement: closestBoneIndex
            } as PushElementCommandInput);
            this.commandRecorder.finishCommand();
            commandManager.finishCommandRecorder();
          }
        }
      }
    }
  }

  public override drawOverlay(editor: AnimaEditor, view: UIComponent_View, renderPass: GPURenderPassEncoder): void {}
}

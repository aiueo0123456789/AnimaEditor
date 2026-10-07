import type { AnimaEditor } from "../../../../editor/Editor";
import { Model_Sprite } from "../../../../core/project/model/Sprite";
import { Runtime_Texture } from "../../../../core/projectCache/runtime/Texture";
import { SpriteState } from "../../../../editor/editorState/state/States/Sprite";
import { ViewEditModes } from "../../../../editor/editorState/ViewEditModes";
import { CommandManager } from "../../../../manager/CommandManager";
import { InputManager } from "../../../../manager/InputManager";
import type { Vec2 } from "../../../../util/vecMath";
import { Column, NumberField, type Widget } from "../../../../manager/ui/components";
import type { UIComponent_View } from "../View";
import { Tool } from "./Tool";
import { editOnce } from "./editOnce";

export class GenerateSilhouetteTool extends Tool {
  public override readonly id = "GenerateSilhouette";
  public override readonly label = "シルエット辺を自動生成";
  public override readonly icon = "addEdge";
  public readonly params = { pixelDensity: 1, padding: 0, simplEpsilon: 1 };
  private controller: AbortController | null = null;
  private isCurrent: (() => boolean) | null = null;

  public override createParamsWidget(_editor: AnimaEditor): Widget {
    const set = (key: keyof typeof this.params, value: number, min: number, max: number): void => {
      if (!Number.isFinite(value)) return;
      const next = Math.max(min, Math.min(max, value));
      if (this.params[key] === next) return;
      this.deactivate();
      this.params[key] = next;
      this.changed();
    };
    return Column({ className: "ui-tool-params", gap: 4, children: [
      NumberField({ label: "Pixel density", value: this.params.pixelDensity, min: .01, max: 1000, step: .01,
        onChange: () => {}, onCommit: value => set("pixelDensity", value, .01, 1000) }),
      NumberField({ label: "Padding", value: this.params.padding, min: -1000, max: 1000, step: .1,
        onChange: () => {}, onCommit: value => set("padding", value, -1000, 1000) }),
      NumberField({ label: "Simplify epsilon", value: this.params.simplEpsilon, min: 0, max: 1000, step: .1,
        onChange: () => {}, onCommit: value => set("simplEpsilon", value, 0, 1000) }),
    ] });
  }

  public override deactivate(): void {
    this.controller?.abort();
    this.controller = null;
    this.isCurrent = null;
  }

  public override update(editor: AnimaEditor, _view: UIComponent_View): void {
    if (this.isCurrent && !this.isCurrent()) this.deactivate();
    if (editor.getManager(InputManager)?.getKeyDown("Mouse0")) {
      void this.generate(editor).catch(error => {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Silhouette generation failed", error);
      });
    }
  }

  public async generate(editor: AnimaEditor): Promise<void> {
    const model = editor.editorState.activeObject;
    const manager = editor.getManager(CommandManager);
    if (this.controller || editor.editorState.editMode !== ViewEditModes.VERTEX ||
        !(model instanceof Model_Sprite) || !manager || manager.commandRecorder) return;
    const state = editor.editorState.getModelStateByID(model.id);
    const runtime = editor.projectCache.getRuntimeByID(model.texture.modelID);
    if (!(state instanceof SpriteState) || !(runtime instanceof Runtime_Texture) || runtime.hasUpdate) return;
    const texture = runtime.texture;
    const project = editor.project;
    const params = { ...this.params };
    const paramsVersion = this.uiVersion;
    const snapshot = () => JSON.stringify([model.vertices, model.edges, model.silhouetteEdges, model.textureRect, model.texture, runtime.model.imagePath]);
    const before = snapshot();
    const controller = new AbortController();
    this.controller = controller;
    const isCurrent = () => !controller.signal.aborted && editor.project === project &&
      editor.editorState.activeObject === model && editor.editorState.editMode === ViewEditModes.VERTEX &&
      editor.editorState.getModelStateByID(model.id) === state &&
      editor.projectCache.getRuntimeByID(model.texture.modelID) === runtime &&
      runtime.texture === texture && !runtime.hasUpdate && !manager.commandRecorder &&
      this.uiVersion === paramsVersion;
    this.isCurrent = isCurrent;
    try {
      const { createEdgeFromTexture } = await import("../../../../library/TextureToEdge/textureToEdge");
      const contour = await createEdgeFromTexture(texture, params.pixelDensity, params.padding,
        params.simplEpsilon, "bottomLeft", { signal: controller.signal });
      if (!isCurrent() || snapshot() !== before || !contour.vertices.length) return;
      let rect = model.textureRect;
      if (!rect.min.concat(rect.max).every(Number.isFinite)) return;
      if (rect.min[0] === rect.max[0] || rect.min[1] === rect.max[1]) {
        rect = { min: [-texture.width / 2, -texture.height / 2], max: [texture.width / 2, texture.height / 2] };
      }
      const contourSize = [texture.width / params.pixelDensity, texture.height / params.pixelDensity];
      const positions: Vec2[] = contour.vertices.map(([x, y]) => [
        rect.min[0] + x / contourSize[0] * (rect.max[0] - rect.min[0]),
        rect.min[1] + y / contourSize[1] * (rect.max[1] - rect.min[1]),
      ]);
      const vertices: Model_Sprite["vertices"] = {};
      const ids = positions.map(co => {
        const id = crypto.randomUUID();
        vertices[id] = Model_Sprite.createVertex({ co });
        return id;
      });
      const silhouetteEdges = Object.fromEntries(contour.edges.map(([a, b]) =>
        [crypto.randomUUID(), Model_Sprite.createEdge({ vertices: [ids[a], ids[b]] })]));
      editOnce(editor, "Generate silhouette", () => [
        { model, path: "vertices", value: vertices },
        { model, path: "silhouetteEdges", value: silhouetteEdges },
        { model, path: "edges", value: {} },
        ...Object.keys(model.boneWeights).map(id => ({
          model, path: `boneWeights.${id}.weights`,
          value: {},
        })),
        { model, path: "animation.trackMap", value: Object.fromEntries(Object.entries(model.animation.trackMap).filter(([path]) => {
          const parts = path.split(".");
          return parts[0] !== "vertices";
        })) },
        { model, path: "textureRect", value: rect },
        { model: state, path: "selectedVertexIDs", value: [...new Set(ids)] },
        { model: state, path: "activeVertexID", value: ids[0] },
      ]);
    } finally {
      if (this.controller === controller) {
        this.controller = null;
        this.isCurrent = null;
      }
    }
  }
}

import { AnimaEditor } from "../../../editor/Editor";
import { simpleWebGPU } from "../../../util/simpleWebGPU";
import { Runtime_Texture } from "../../projectCache/runtime/Texture";
import { System } from "../System";

/**
 * ランタイムテクスチャの初期化
 */
export class System_Init_Texture extends System {
  constructor(editor: AnimaEditor) {
    super(editor);
  }

  public override start(): void {
  }

  public override end(): void {
  }

  public override update(): void {
    const targets = this.editor.projectCache.getRuntimesByType(Runtime_Texture);
    for (const runtime of targets) {
      const model = runtime.model;
      if (runtime.hasUpdate) {
        const promiseFn = async (): Promise<void> => {
          const bitmap = await simpleWebGPU.imagePathToBitmap(model.imagePath);
          runtime.texture = await simpleWebGPU.bitmapToTexture2D(bitmap);
          console.log(bitmap, runtime.texture);
          runtime.hasUpdate = false;
        }
        promiseFn();
      }
    }
  }
}

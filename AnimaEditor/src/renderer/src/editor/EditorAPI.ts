import { EditorEventType, EventManager } from "../manager/EventManager";
import { AnimaEditor } from "./Editor";

export class EditorAPI {
  private editor: AnimaEditor;
  constructor(editor: AnimaEditor) {
    this.editor = editor;
  }

  public clearElements(object: unknown, path: string): void {
    if (!object) return ;
    const dividedPath = path.split(".");
    if (dividedPath.length === 0) return ;
    const o = this.getProperty(object, path);
    if (!Array.isArray(o)) {
      console.warn("配列以外の要素が指定されています", object, path)
      return ;
    }
    o.length = 0;

    const eventManager = this.editor.getManager(EventManager);
    if (!eventManager) return ;

    eventManager.emit(EditorEventType.add, object, path);
  }

  public setElements(object: unknown, path: string, elements: unknown[]): void {
    if (!object) return ;
    const dividedPath = path.split(".");
    if (dividedPath.length === 0) return ;
    const o = this.getProperty(object, path);
    if (!Array.isArray(o) || !Array.isArray(elements)) {
      console.warn("配列以外の要素が指定されています", object, path, elements)
      return ;
    }
    o.length = 0;
    for (const element of elements) {
      o.push(element);
    }

    const eventManager = this.editor.getManager(EventManager);
    if (!eventManager) return ;

    eventManager.emit(EditorEventType.add, object, path);
  }

  public concatElements(object: unknown, path: string, elements: unknown[]): void {
    if (!object) return ;
    const dividedPath = path.split(".");
    if (dividedPath.length === 0) return ;
    const o = this.getProperty(object, path);
    if (!Array.isArray(o) || !Array.isArray(elements)) {
      console.warn("配列以外の要素が指定されています", object, path, elements)
      return ;
    }
    for (const element of elements) {
      o.push(element);
    }

    const eventManager = this.editor.getManager(EventManager);
    if (!eventManager) return ;

    eventManager.emit(EditorEventType.add, object, path);
  }

  public pushElement(object: unknown, path: string, element: unknown): void {
    if (!object) return ;
    const dividedPath = path.split(".");
    if (dividedPath.length === 0) return ;
    const o = this.getProperty(object, path);
    if (!Array.isArray(o)) {
      console.warn("配列以外の要素が指定されています", object, path, element)
      return ;
    }
    o.push(element);

    const eventManager = this.editor.getManager(EventManager);
    if (!eventManager) return ;

    eventManager.emit(EditorEventType.add, object, path);
  }

  public insertElement(object: unknown, path: string, index: number, element: unknown): void {
    if (!object) return ;
    const dividedPath = path.split(".");
    if (dividedPath.length === 0) return ;
    const o = this.getProperty(object, path);
    if (!Array.isArray(o)) {
      console.warn("配列以外の要素が指定されています", object, path, element)
      return ;
    }
    o.splice(index, 0, element);

    const eventManager = this.editor.getManager(EventManager);
    if (!eventManager) return ;

    eventManager.emit(EditorEventType.add, object, path);
  }

  public deleteElement(object: unknown, path: string, element: number): void {
    if (!object) return ;
    const dividedPath = path.split(".");
    if (dividedPath.length === 0) return ;
    const o = this.getProperty(object, path);
    if (!Array.isArray(o)) {
      console.warn("配列以外の要素が指定されています", object, path);
      return ;
    }
    const index = o.indexOf(element);
    if (index === -1) {
      console.warn("削除対象が見つかりません")
      return ;
    }
    o.splice(index, 1);

    const eventManager = this.editor.getManager(EventManager);
    if (!eventManager) return ;

    eventManager.emit(EditorEventType.delete, object, path);
  }

  public deleteElementByIndex(object: unknown, path: string, index: number): void {
    if (!object) return ;
    const dividedPath = path.split(".");
    if (dividedPath.length === 0) return ;
    const o = this.getProperty(object, path);
    if (!Array.isArray(o)) {
      console.warn("配列以外の要素が指定されています", object, path);
      return ;
    }
    o.splice(index, 1);

    const eventManager = this.editor.getManager(EventManager);
    if (!eventManager) return ;

    eventManager.emit(EditorEventType.delete, object, path);
  }

  public deleteLastElement(object: unknown, path: string): void {
    if (!object) return ;
    const dividedPath = path.split(".");
    if (dividedPath.length === 0) return ;
    const o = this.getProperty(object, path);
    if (!Array.isArray(o)) {
      console.warn("配列以外の要素が指定されています", object, path)
      return ;
    }
    o.pop();

    const eventManager = this.editor.getManager(EventManager);
    if (!eventManager) return ;

    eventManager.emit(EditorEventType.delete, object, path);
  }

  public setProperty(object: unknown, path: string, value: unknown): void {
    // if (!(model instanceof Model)) {
    //   console.warn("モデル以外の変更はできません", model);
    //   return ;
    // }
    if (!object) return ;
    const dividedPath = path.split(".");
    if (dividedPath.length === 0) return ;
    const lastP = dividedPath.pop();
    if (!lastP) return ;
    let o = object;
    for (const p of dividedPath) {
      o = o[p];
    }
    o[lastP] = value;

    const eventManager = this.editor.getManager(EventManager);
    if (!eventManager) return ;

    eventManager.emit(EditorEventType.change, object, path);
  }

  public getProperty(object: unknown, path: string): unknown {
    if (!object) return ;
    const dividedPath = path.split(".");
    if (dividedPath.length === 0) return ;
    let o = object;
    for (const p of dividedPath) {
      o = o[p];
    }
    return o;
  }
}
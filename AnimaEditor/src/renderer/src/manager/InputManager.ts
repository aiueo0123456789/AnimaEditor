import { Manager } from "./Manager";
import { Vec2, Vec2Math } from "../util/vecMath";
import { AnimaEditor } from "../editor/Editor";


export class InputManager extends Manager {
  public mousePosition: Vec2;
  public mouseMovement: Vec2;
  public current: Record<string, boolean>;
  public previous: Record<string, boolean>;
  public mouseScrollDelta: Vec2;
  public dragging: boolean;

  private lastClickTime: number;

  constructor(editor: AnimaEditor) {
    super(editor);
    this.mousePosition = Vec2Math.create();
    this.mouseMovement = Vec2Math.create();
    this.current = {};
    this.previous = {};
    this.mouseScrollDelta = Vec2Math.create();
    this.dragging = false;
    this.lastClickTime = 0;
  }

  start() {
    window.addEventListener("mousedown", (e) => {
      this.lastClickTime = Date.now();
      this.setKey("Mouse0", true);
      Vec2Math.set(e.clientX, e.clientY, this.mousePosition);
    });
    window.addEventListener("mouseup", (e) => {
      this.setKey("Mouse0", false);
      Vec2Math.set(e.clientX, e.clientY, this.mousePosition);
    });
    window.addEventListener("mousemove", (e) => {
      Vec2Math.set(e.clientX, e.clientY, this.mousePosition);
      Vec2Math.set(e.movementX, e.movementY, this.mouseMovement);
    });
    window.addEventListener("keydown", (e) => {
      console.log("押された", e.code);
      if (e.key === "Tab") e.preventDefault();
      this.setKeyDown(e.code);
    });
    window.addEventListener("keyup", (e) => {
      console.log("はなした", e.code);
      this.setKey(e.code, false);
    });
    window.addEventListener("wheel", (e) => {
      Vec2Math.set(-e.deltaX, e.deltaY, this.mouseScrollDelta);
    });
    this.update();
  }

  update() {
    if (
      this.getKey("Mouse0") &&
      (Date.now() - this.lastClickTime) / 1000 > 0.1
    ) {
      // 0.1秒以上クリックされている場合
      this.dragging = true;
    } else {
      this.dragging = false;
    }
  }

  updateLate() {
    // 前フレーム保存
    this.previous = {};
    for (const key in this.current) {
      this.previous[key] = this.current[key];
    }
    this.mouseScrollDelta[0] = 0;
    this.mouseScrollDelta[1] = 0;
    this.mouseMovement[0] = 0;
    this.mouseMovement[1] = 0;
  }

  private setKey(key: string, value: boolean) {
    this.current[key] = value;
  }

  // 強制的入力判定にする
  private setKeyDown(key: string) {
    this.current[key] = true;
    this.previous[key] = false;
  }

  getKey(key: string) {
    return this.current[key];
  }

  getKeyDown(key: string) {
    return this.current[key] && !this.previous[key];
  }

  getKeyUp(key: string) {
    return !this.current[key] && this.previous[key];
  }
}

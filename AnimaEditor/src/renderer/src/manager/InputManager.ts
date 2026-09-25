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
  private readonly pressed = new Set<string>();
  private readonly released = new Set<string>();

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
      this.setKey(`Mouse${e.button}`, true);
      Vec2Math.set(e.clientX, e.clientY, this.mousePosition);
    });
    window.addEventListener("mouseup", (e) => {
      this.setKey(`Mouse${e.button}`, false);
      Vec2Math.set(e.clientX, e.clientY, this.mousePosition);
    });
    window.addEventListener("mousemove", (e) => {
      Vec2Math.set(e.clientX, e.clientY, this.mousePosition);
      this.mouseMovement[0] += e.movementX;
      this.mouseMovement[1] += e.movementY;
    });
    window.addEventListener("keydown", (e) => {
      if ((e.target as HTMLElement)?.closest("input, textarea, [contenteditable='true']")) return;
      this.setKey(e.code, true);
    });
    window.addEventListener("keyup", (e) => {
      this.setKey(e.code, false);
    });
    window.addEventListener("wheel", (e) => {
      Vec2Math.set(-e.deltaX, e.deltaY, this.mouseScrollDelta);
    });
    window.addEventListener("blur", () => {
      this.current = {};
      this.previous = {};
      this.pressed.clear();
      this.released.clear();
      this.dragging = false;
      Vec2Math.clear(this.mouseMovement);
      Vec2Math.clear(this.mouseScrollDelta);
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
    this.pressed.clear();
    this.released.clear();
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
    if (value && !this.current[key]) this.pressed.add(key);
    if (!value && this.current[key]) this.released.add(key);
    this.current[key] = value;
  }

  getKey(key: string) {
    return this.current[key];
  }

  getKeyDown(key: string) {
    return this.pressed.has(key) || (this.current[key] && !this.previous[key]);
  }

  getKeyUp(key: string) {
    return this.released.has(key) || (!this.current[key] && this.previous[key]);
  }
}

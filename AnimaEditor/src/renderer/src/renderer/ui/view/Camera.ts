import { Vec2, Vec2Math } from "../../../util/vecMath";

export class View_Camera {
  public position: Vec2;
  public zoom: number;
  public rotation: number;
  constructor() {
    this.position = Vec2Math.create();
    this.zoom = 1;
    this.rotation = 0;
  }
}
export type Color = [number, number, number, number];

export class ColorMath {
  static create(r = 0, g = 0, b = 0, a = 1): Color {
    return [r, g, b, a];
  }
}
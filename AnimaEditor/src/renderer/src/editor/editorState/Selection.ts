import type { ID } from "../Editor";
export class ObjectSelection {
  public activeObjectID: ID | null = null;
  public selectedObjectsID: ID[] = [];
  public hoverObjectID: ID | null = null;
}
export class AnimationSelection {
  public activeAnimationID: ID | null = null;
  public selectedAnimationsID: ID[] = [];
}
export class TextureSelection {
  public activeTextureID: ID | null = null;
}
export type SelectionDomain = "objects" | "animations" | "textures";

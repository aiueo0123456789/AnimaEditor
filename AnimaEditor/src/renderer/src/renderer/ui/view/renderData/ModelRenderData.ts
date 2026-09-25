export abstract class View_ModelRenderData {
  public numberID: number;
  constructor(numberID: number) {
    this.numberID = numberID;
  }
  public dispose(): void {
    for (const [key, value] of Object.entries(this)) {
      if (key.endsWith("Buffer") && value && typeof value.destroy === "function") value.destroy();
    }
  }
}

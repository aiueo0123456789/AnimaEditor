export abstract class Tool {
  public isTool: boolean;
  constructor() {
    this.isTool = true;
  }

  public abstract activate(...args: unknown[]): void

  public abstract deactivate(...args: unknown[]): void

  public abstract update(...args: unknown[]): void

  public abstract drawOverlay(...args: unknown[]): void
}

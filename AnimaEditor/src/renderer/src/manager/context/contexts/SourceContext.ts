
export abstract class SourceContext {
  public id: string;
  constructor(id: string) {
    this.id = id;
  }

  abstract resolve(): unknown
}
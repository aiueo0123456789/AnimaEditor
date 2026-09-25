import { ID } from "../../editor/Editor";
import { Model } from "../project/Model";

export class ReferenceResolver {
  public static readonly SOURCE = { OBJECT: "OBJECT", BONE: "BONE" };
  public static readonly PATH = { ARRAY: "ARRAY", DICTIONARY: "DICTIONARY" };

  public id: string;
  constructor(id: string) {
    this.id = id;
  }
}

export class Runtime<T extends Model> {
  public isRuntime: boolean;
  public model: T;
  public id: ID;

  public static referenceResolver: any;

  constructor(model: T) {
    this.isRuntime = true;

    this.id = model.id;

    this.model = model;
  }

  // getAnimationProperty(path) {}

  // setAnimationProperty(path, value) {}
}

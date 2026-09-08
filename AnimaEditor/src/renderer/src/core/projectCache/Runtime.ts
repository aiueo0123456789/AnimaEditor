import { ID } from "../../editor/Editor";
import { Models } from "../project/Project";

export class ReferenceResolver {
  public static SOURCE = { OBJECT: "OBJECT", BONE: "BONE" };
  public static PATH = { ARRAY: "ARRAY" };

  public id: string;
  constructor(id: string) {
    this.id = id;
  }
}

export class Runtime {
  public isRuntime: boolean;
  public model: Models;
  public id: ID;

  public static referenceResolver: any;

  constructor(model: Models) {
    this.isRuntime = true;

    this.id = model.id;

    this.model = model;
  }

  // getAnimationProperty(path) {}

  // setAnimationProperty(path, value) {}
}

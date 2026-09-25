import { ID } from "../../editor/Editor";
import { Model } from "../project/Model";
import { System_Runtime_ReferencesResolver } from "../system/runtime/Runtime";

export abstract class Runtime<T extends Model> {
  public isRuntime: boolean;
  public model: T;
  public id: ID;

  constructor(model: T) {
    this.isRuntime = true;

    this.id = model.id;

    this.model = model;
  }

  abstract resolveReferences(referencesResolver: System_Runtime_ReferencesResolver): void;

  // getAnimationProperty(path) {}

  // setAnimationProperty(path, value) {}
}

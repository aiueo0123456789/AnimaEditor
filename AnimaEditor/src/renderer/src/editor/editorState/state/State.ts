import { Models } from "../../../core/project/Project";
import { ID } from "../../Editor";

export class State {
  public isModelState: boolean;
  public id: ID;
  public model: Models;

  constructor(model: Models) {
    this.isModelState = true;
    this.id = model.id;
    this.model = model;
  }
}

import { Model } from "../../../core/project/Model";
import { ViewEditModes } from "../../../renderer/ui/view/ViewEditModes";
import { ID } from "../../Editor";

export class State<M extends Model> {
  public isModelState: boolean;
  public id: ID;
  public model: M;
  public availableModes: ViewEditModes[] = [ViewEditModes.OBJECT];

  constructor(model: M) {
    this.isModelState = true;
    this.id = model.id;
    this.model = model;
  }
}
import { Model, ModelInput } from "../Model";

export interface Model_TextureInput extends ModelInput {
  imagePath?: string,
}


export class Model_Texture extends Model {
  public imagePath: string;
  constructor(data: Model_TextureInput) {
    super(data);
    this.imagePath = data.imagePath ?? "";
  }
}

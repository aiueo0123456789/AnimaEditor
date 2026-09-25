import { EditorAPI } from "../../EditorAPI";
import { updatePreview } from "../updatePreview";
import { PrimitiveCommand, PrimitiveCommandInput, CommandReturn } from "./PrimitiveCommand";

export interface ConcatArrayCommandInput extends PrimitiveCommandInput {
  newElements: unknown[]
}

export interface ConcatArrayCommandUpdate {
  newElements: unknown[]
}

export class ConcatArrayCommand extends PrimitiveCommand {
  private newElements: any[] | null;
  private oldElements: any[];

  constructor(api: EditorAPI, data: ConcatArrayCommandInput) {
    super(api, data);

    this.newElements = data.newElements;

    this.oldElements = [];

  }

  public override begin(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;

    const array = this.api.getProperty(this.model, this.path) as [];
    if (!Array.isArray(array)) return CommandReturn.ERROR;
    this.oldElements = [...array];

    return this.redo();
  }

  public override update(data: ConcatArrayCommandUpdate): CommandReturn {
    if (!Array.isArray(data.newElements)) return CommandReturn.ERROR;
    const elements = [...data.newElements];
    return updatePreview(this, () => { this.newElements = elements; });
  }

  public override redo(): CommandReturn {
    if (!Array.isArray(this.newElements)) return CommandReturn.ERROR;

    this.api.setElements(this.model, this.path, [...this.oldElements, ...this.newElements]);
    return CommandReturn.FINISHED;
  }

  public override cancel(): CommandReturn {
    if (this.commited) return CommandReturn.ERROR;
    return this.undo();
  }

  public override undo(): CommandReturn {
    this.api.setElements(this.model, this.path, this.oldElements);
    return CommandReturn.FINISHED;
  }
}

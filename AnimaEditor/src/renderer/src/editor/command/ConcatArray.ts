import { EditorAPI } from "../EditorAPI";
import { Command, CommandReturn } from "./Command";

export interface ConcatArrayCommandInput {
  model: unknown,
  path: string,
  newElements: unknown[]
}

export interface ConcatArrayCommandUpdate {
  newElements: unknown[]
}

export class ConcatArrayCommand extends Command {
  private model: any;
  private path: string;
  private newElements: any[] | null;
  private oldElements: any[];

  constructor(api: EditorAPI) {
    super(api);

    this.model = null;
    this.path = "";
    this.newElements = null;

    this.oldElements = [];
  }

  public override set(data: ConcatArrayCommandInput): CommandReturn {
    if (this.isStop()) return CommandReturn.ERROR;
    this.model = data.model;
    this.path = data.path;

    const array = this.api.getProperty(this.model, this.path) as [];
    if (!Array.isArray(array)) return CommandReturn.ERROR;
    this.oldElements = [...array];

    if (!Array.isArray(data.newElements)) return CommandReturn.ERROR;
    this.newElements = data.newElements;

    return CommandReturn.FINISHED;
  }

  public override update(data: ConcatArrayCommandUpdate): CommandReturn {
    if (this.isStop()) return CommandReturn.ERROR;
    this.newElements = data.newElements;
    return this.execute();
  }

  public override execute(): CommandReturn {
    if (!Array.isArray(this.newElements)) return CommandReturn.ERROR;

    this.api.concatElements(this.model, this.path, this.newElements);
    return CommandReturn.FINISHED;
  }

  public override undo(): CommandReturn {
    this.api.setElements(this.model, this.path, this.oldElements);
    return CommandReturn.FINISHED;
  }
}

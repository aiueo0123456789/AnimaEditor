import { Model_Sprite } from "../../core/project/model/Sprite";
import { CommandReturn } from "../command/Command";
import { RemoveItemsCommand, RemoveItemsCommandInput } from "../command/RemoveItems";
import { AnimaEditor } from "../Editor";
import { CommandBlock, CommandData } from "./CommandBlock";

export interface DeleteVertexCommandBlockInput {
  sprite: Model_Sprite,
  deleteVertexIndices: number[];
}

export class DeleteVertexCommandBlock extends CommandBlock {
  constructor(editor: AnimaEditor) {
    super(editor);
  }

  public set(data: DeleteVertexCommandBlockInput): CommandReturn {
    const deleteVertexIDs = data.deleteVertexIndices.map(deleteIndex => data.sprite.vertices[deleteIndex].id);
    // 頂点の削除
    const vertexDeleteCommand = new CommandData(
      RemoveItemsCommand,
      {
        model: data.sprite,
        path: "vertices",
        removeIndices: data.deleteVertexIndices
      } as RemoveItemsCommandInput
    );
    this.commandDatas.push(vertexDeleteCommand);

    // 辺の削除
    const edgeIndices: number [] = [];
    data.sprite.edges.filter((edge, ei) => {
      if (edge.vertices.filter(vID => deleteVertexIDs.includes(vID)).length) edgeIndices.push(ei);
    })
    const edgeDeleteCommand = new CommandData(
      RemoveItemsCommand,
      {
        model: data.sprite,
        path: "edges",
        removeIndices: edgeIndices
      } as RemoveItemsCommandInput
    );
    this.commandDatas.push(edgeDeleteCommand);

    return CommandReturn.FINISHED;
  }
}
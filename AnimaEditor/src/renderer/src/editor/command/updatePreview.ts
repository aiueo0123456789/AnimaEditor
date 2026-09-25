import { CommandReturn } from "./primitiveCommand/PrimitiveCommand";

// Input validation must happen before this transaction changes the preview.
export function updatePreview(
  command: { commited: boolean; hasError: boolean; undo(): CommandReturn; redo(): CommandReturn },
  updateInput: () => void,
): CommandReturn {
  if (command.commited || command.hasError) return CommandReturn.ERROR;
  if (command.undo() === CommandReturn.ERROR) return CommandReturn.ERROR;
  updateInput();
  return command.redo();
}

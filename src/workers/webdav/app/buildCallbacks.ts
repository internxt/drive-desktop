import { DependencyContainer } from '../dependencyInjection/DependencyContainer';
import { AddFileCallback } from './callbacks/AddFileCallback';
import { RenameOrMoveCallback } from './callbacks/RenameOrMoveCallback';

export function buildCallbacks(container: DependencyContainer) {
  const addFileCallback = new AddFileCallback(
    container.contentsUploader,
    container.filePathFromAbsolutePathCreator,
    container.fileCreator
  );

  const renameOrMoveFileCallback = new RenameOrMoveCallback(
    container.filePathFromAbsolutePathCreator,
    container.fileRenamer
  );

  return {
    addFile: addFileCallback,
    renameOrMoveFile: renameOrMoveFileCallback,
  } as const;
}

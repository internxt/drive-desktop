import { DependencyContainer } from '../dependencyInjection/DependencyContainer';
import { AddFileCallback } from './callbacks/AddFileCallback';
import { DeleteFileCallback } from './callbacks/DeleteFileCallback';
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

  const deleteFileCallback = new DeleteFileCallback(container.fileDeleter);

  return {
    addFile: addFileCallback,
    renameOrMoveFile: renameOrMoveFileCallback,
    deleteFile: deleteFileCallback,
  } as const;
}

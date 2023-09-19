import { DependencyContainer } from '../dependencyInjection/DependencyContainer';
import { AddFileController } from './controllers/AddFileController';
import { DeleteFileController } from './controllers/DeleteFileController';
import { RenameOrMoveController } from './controllers/RenameOrMoveController';

export function buildControllers(container: DependencyContainer) {
  const addFileCallback = new AddFileController(
    container.contentsUploader,
    container.filePathFromAbsolutePathCreator,
    container.fileCreator
  );

  const renameOrMoveFileCallback = new RenameOrMoveController(
    container.filePathFromAbsolutePathCreator,
    container.filePathUpdater
  );

  const deleteFileCallback = new DeleteFileController(container.fileDeleter);

  return {
    addFile: addFileCallback,
    renameOrMoveFile: renameOrMoveFileCallback,
    deleteFile: deleteFileCallback,
  } as const;
}

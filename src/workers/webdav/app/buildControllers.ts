import { DependencyContainer } from '../dependencyInjection/DependencyContainer';
import { AddFileController } from './controllers/AddFileController';
import { DeleteFileController } from './controllers/DeleteFileController';
import { DownloadFileController } from './controllers/DownloadFileController';
import { RenameOrMoveController } from './controllers/RenameOrMoveController';

export function buildControllers(container: DependencyContainer) {
  const addFileController = new AddFileController(
    container.contentsUploader,
    container.filePathFromAbsolutePathCreator,
    container.fileCreator
  );

  const renameOrMoveFileController = new RenameOrMoveController(
    container.filePathFromAbsolutePathCreator,
    container.filePathUpdater
  );

  const deleteFileController = new DeleteFileController(container.fileDeleter);

  const downloadFileController = new DownloadFileController(
    container.fileFinderByContentsId,
    container.contentsDownloader
  );

  return {
    addFile: addFileController,
    renameOrMoveFile: renameOrMoveFileController,
    deleteFile: deleteFileController,
    downloadFile: downloadFileController,
  } as const;
}

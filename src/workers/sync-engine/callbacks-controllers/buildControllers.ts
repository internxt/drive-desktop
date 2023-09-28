import { DependencyContainer } from '../dependency-injection/DependencyContainer';
import { AddFileController } from './controllers/AddFileController';
import { DeleteController } from './controllers/DeleteController';
import { DownloadFileController } from './controllers/DownloadFileController';
import { RenameOrMoveController } from './controllers/RenameOrMoveController';

export function buildControllers(container: DependencyContainer) {
  const addFileController = new AddFileController(
    container.contentsUploader,
    container.filePathFromAbsolutePathCreator,
    container.fileCreator,
    container.fileDeleter,
    container.fileByPartialSearcher,
    container.folderCreator,
    container.folderFinder
  );

  const deleteController = new DeleteController(
    container.fileDeleter,
    container.folderDeleter
  );

  const renameOrMoveFileController = new RenameOrMoveController(
    container.filePathFromAbsolutePathCreator,
    container.filePathUpdater,
    container.folderPathUpdater,
    deleteController
  );

  const downloadFileController = new DownloadFileController(
    container.fileFinderByContentsId,
    container.contentsDownloader,
    container.localRepositoryRefresher
  );

  return {
    addFile: addFileController,
    renameOrMoveFile: renameOrMoveFileController,
    delete: deleteController,
    downloadFile: downloadFileController,
  } as const;
}

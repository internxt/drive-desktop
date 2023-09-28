import { DependencyContainer } from '../dependency-injection/DependencyContainer';
import { AddController } from './controllers/AddController';
import { DeleteController } from './controllers/DeleteController';
import { DownloadFileController } from './controllers/DownloadFileController';
import { RenameOrMoveController } from './controllers/RenameOrMoveController';

export function buildControllers(container: DependencyContainer) {
  const addFileController = new AddController(
    container.fileCreationOrchestrator,
    container.folderCreator
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

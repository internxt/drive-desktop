import { SyncEngineDependencyContainer } from '../dependency-injection/SyncEngineDependencyContainer';
import { AddController } from './controllers/AddController';
import { DeleteController } from './controllers/DeleteController';
import { DownloadFileController } from './controllers/DownloadFileController';
import { NotifyPlaceholderHydrationFinished } from './controllers/NotifyPlaceholderHydrationFinished';
import { RenameOrMoveController } from './controllers/RenameOrMoveController';
import { OfflineRenameOrMoveController } from './controllers/offline/OfflineRenameOrMoveController';

export function buildControllers(container: SyncEngineDependencyContainer) {
  const addFileController = new AddController(
    container.absolutePathToRelativeConverter,
    container.fileCreationOrchestrator,
    container.folderCreator,
    container.offline.folderCreator
  );

  const deleteController = new DeleteController(
    container.fileDeleter,
    container.folderDeleter
  );

  const renameOrMoveController = new RenameOrMoveController(
    container.absolutePathToRelativeConverter,
    container.filePathUpdater,
    container.folderPathUpdater,
    deleteController
  );

  const downloadFileController = new DownloadFileController(
    container.singleFileMatchingFinder,
    container.contentsDownloader
  );

  const offlineRenameOrMoveController = new OfflineRenameOrMoveController(
    container.absolutePathToRelativeConverter,
    container.offline.folderPathUpdater
  );

  const notifyPlaceholderHydrationFinished =
    new NotifyPlaceholderHydrationFinished(
      container.notifyMainProcessHydrationFinished
    );

  return {
    addFile: addFileController,
    renameOrMove: renameOrMoveController,
    delete: deleteController,
    downloadFile: downloadFileController,
    offline: {
      renameOrMove: offlineRenameOrMoveController,
    },
    notifyPlaceholderHydrationFinished,
  } as const;
}

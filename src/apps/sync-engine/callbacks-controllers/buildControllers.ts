import { DependencyContainer } from '../dependency-injection/DependencyContainer';
import { AddController } from './controllers/AddController';
import { DeleteController } from './controllers/DeleteController';
import { DownloadFileController } from './controllers/DownloadFileController';
import { NotifyPlaceholderHydrationFinished } from './controllers/NotifyPlaceholderHydrationFinished';
import { RenameOrMoveController } from './controllers/RenameOrMoveController';
import { OfflineRenameOrMoveController } from './controllers/offline/OfflineRenameOrMoveController';

export interface IControllers {
  addFile: AddController;
  renameOrMove: RenameOrMoveController;
  delete: DeleteController;
  downloadFile: DownloadFileController;
  offline: {
    renameOrMove: OfflineRenameOrMoveController;
  };
  notifyPlaceholderHydrationFinished: NotifyPlaceholderHydrationFinished;
}

export function buildControllers(container: DependencyContainer): IControllers {
  const addFileController = new AddController(
    container.absolutePathToRelativeConverter,
    container.fileCreationOrchestrator,
    container.folderCreator,
    container.offline.folderCreator,
  );

  const deleteController = new DeleteController(
    container.fileDeleter,
    container.retryFolderDeleter,
    container.fileFolderContainerDetector,
    container.folderContainerDetector,
  );

  const renameOrMoveController = new RenameOrMoveController(
    container.absolutePathToRelativeConverter,
    container.filePathUpdater,
    container.folderPathUpdater,
    deleteController,
  );

  const downloadFileController = new DownloadFileController(container.fileFinderByContentsId, container.contentsDownloader);

  const offlineRenameOrMoveController = new OfflineRenameOrMoveController(
    container.absolutePathToRelativeConverter,
    container.offline.folderPathUpdater,
  );

  const notifyPlaceholderHydrationFinished = new NotifyPlaceholderHydrationFinished(container.notifyMainProcessHydrationFinished);

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

import { DependencyContainer } from '../dependency-injection/DependencyContainer';
import { AddController } from './controllers/AddController';
import { DeleteController } from './controllers/DeleteController';
import { DownloadFileController } from './controllers/DownloadFileController';
import { RenameOrMoveController } from './controllers/RenameOrMoveController';

export interface IControllers {
  addFile: AddController;
  renameOrMove: RenameOrMoveController;
  delete: DeleteController;
  downloadFile: DownloadFileController;
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
    container.folderDeleter,
    container.fileFolderContainerDetector,
    container.folderContainerDetector,
  );

  const renameOrMoveController = new RenameOrMoveController(
    container.absolutePathToRelativeConverter,
    container.filePathUpdater,
    container.folderPathUpdater,
    deleteController,
  );

  const downloadFileController = new DownloadFileController(container.contentsDownloader, container.fileRepository);

  return {
    addFile: addFileController,
    renameOrMove: renameOrMoveController,
    delete: deleteController,
    downloadFile: downloadFileController,
  } as const;
}

import { DependencyContainer } from '../dependency-injection/DependencyContainer';
import { AddController } from './controllers/add-controller';
import { DeleteController } from './controllers/DeleteController';
import { DownloadFileController } from './controllers/DownloadFileController';

export interface IControllers {
  addFile: AddController;
  delete: DeleteController;
  downloadFile: DownloadFileController;
}

export function buildControllers(container: DependencyContainer): IControllers {
  const addFileController = new AddController(container.fileCreationOrchestrator, container.folderCreator);

  const deleteController = new DeleteController(
    container.fileDeleter,
    container.folderDeleter,
    container.fileFolderContainerDetector,
    container.folderContainerDetector,
  );

  const downloadFileController = new DownloadFileController(container.contentsDownloader, container.fileRepository);

  return {
    addFile: addFileController,
    delete: deleteController,
    downloadFile: downloadFileController,
  } as const;
}

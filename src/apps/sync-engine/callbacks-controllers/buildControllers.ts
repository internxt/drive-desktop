import { DependencyContainer } from '../dependency-injection/DependencyContainer';
import { AddController } from './controllers/add-controller';
import { DownloadFileController } from './controllers/DownloadFileController';

export interface IControllers {
  addFile: AddController;
  downloadFile: DownloadFileController;
}

export function buildControllers(container: DependencyContainer): IControllers {
  const addFileController = new AddController(container.fileCreationOrchestrator, container.folderCreator);

  const downloadFileController = new DownloadFileController(container.contentsDownloader, container.fileRepository);

  return {
    addFile: addFileController,
    downloadFile: downloadFileController,
  } as const;
}

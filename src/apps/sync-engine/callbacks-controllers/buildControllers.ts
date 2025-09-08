import { DependencyContainer } from '../dependency-injection/DependencyContainer';
import { DownloadFileController } from './controllers/DownloadFileController';

export interface IControllers {
  downloadFile: DownloadFileController;
}

export function buildControllers(container: DependencyContainer): IControllers {
  const downloadFileController = new DownloadFileController(container.contentsDownloader);

  return {
    downloadFile: downloadFileController,
  };
}

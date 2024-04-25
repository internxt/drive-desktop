import { DownloaderHandler } from './DownloaderHandler';

export abstract class DownloaderHandlerFactory {
  abstract downloader(): DownloaderHandler;
}

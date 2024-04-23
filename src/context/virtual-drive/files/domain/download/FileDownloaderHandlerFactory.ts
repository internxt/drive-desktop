import { FileDownloaderHandler } from './FileDownloaderHandler';

export abstract class FileDownloaderHandlerFactory {
  abstract downloader(): FileDownloaderHandler;
}

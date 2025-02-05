import { DownloaderHandler } from '../DownloaderHandler';
import { DownloaderHandlerFactory } from '../DownloaderHandlerFactory';

export class DownloaderHandlerFactoryMock implements DownloaderHandlerFactory {
  downloader = jest.fn<DownloaderHandler, []>();
}

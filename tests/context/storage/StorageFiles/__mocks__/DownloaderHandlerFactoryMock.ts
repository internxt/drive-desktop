import { Readable } from 'stream';
import { StorageFile } from '../../../../../src/context/storage/StorageFiles/domain/StorageFile';
import { DownloaderHandler } from '../../../../../src/context/storage/StorageFiles/domain/download/DownloaderHandler';
import { DownloaderHandlerFactory } from '../../../../../src/context/storage/StorageFiles/domain/download/DownloaderHandlerFactory';

export class DownloaderHandlerFactoryMock implements DownloaderHandlerFactory {
  private downloaderMock = jest.fn();

  downloader(): DownloaderHandler {
    return this.downloaderMock();
  }

  async run(
    file: StorageFile,
    metadata: {
      name: string;
      type: string;
      size: number;
    }
  ): Promise<Readable> {
    return this.downloaderMock(file, metadata);
  }
}

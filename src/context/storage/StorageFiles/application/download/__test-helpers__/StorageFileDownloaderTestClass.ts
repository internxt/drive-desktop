import { Readable } from 'stream';
import { StorageFileDownloader } from '../StorageFileDownloader/StorageFileDownloader';
import { StorageFile } from '../../../domain/StorageFile';
import { DownloadProgressTrackerMock } from '../../../__mocks__/DownloadProgressTrackerMock';
import { DownloaderHandlerFactoryMock } from '../../../domain/download/__mocks__/DownloaderHandlerFactoryMock';
import { DownloaderHandler } from '../../../domain/download/DownloaderHandler';

export class StorageFileDownloaderTestClass extends StorageFileDownloader {
  private mock = vi.fn();

  constructor() {
    const factory = new DownloaderHandlerFactoryMock();
    const tracker = new DownloadProgressTrackerMock();
    super(factory, tracker);
  }

  run(
    file: StorageFile,
    metadata: { name: string; type: string; size: number },
  ): Promise<{ stream: Readable; metadata: typeof metadata; handler: DownloaderHandler }> {
    return this.mock(file, metadata);
  }

  returnsAReadable() {
    const factory = new DownloaderHandlerFactoryMock();
    const handler = factory.downloader();
    (handler.elapsedTime as any).mockReturnValue(1000);
    this.mock.mockResolvedValue({
      stream: Readable.from('Hello world!'),
      metadata: { name: 'test', type: 'txt', size: 12 },
      handler,
    });
  }

  assertHasBeenCalled() {
    expect(this.mock).toHaveBeenCalled();
  }

  assertHasBeenCalledWithStorageFile(calls: Array<StorageFile>) {
    calls.forEach((parameters) => {
      expect(this.mock).toBeCalledWith(...[parameters, expect.anything()]);
    });
  }

  assertHasNotBeenCalled() {
    expect(this.mock).not.toHaveBeenCalled();
  }
}

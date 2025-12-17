import { Readable } from 'stream';
import { StorageFileDownloader } from '../StorageFileDownloader/StorageFileDownloader';
import { StorageFile } from '../../../domain/StorageFile';
import { DownloadProgressTrackerMock } from '../../../__mocks__/DownloadProgressTrackerMock';
import { DownloaderHandlerFactoryMock } from '../../../domain/download/__mocks__/DownloaderHandlerFactoryMock';

export class StorageFileDownloaderTestClass extends StorageFileDownloader {
  private mock = vi.fn();

  constructor() {
    const factory = new DownloaderHandlerFactoryMock();
    const tracker = new DownloadProgressTrackerMock();
    super(factory, tracker);
  }

  run(file: StorageFile, metadata: { name: string; type: string; size: number }): Promise<Readable> {
    return this.mock(file, metadata);
  }

  returnsAReadable() {
    this.mock.mockResolvedValue(Readable.from('Hello world!'));
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

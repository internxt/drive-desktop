import { StorageFileDownloader } from './StorageFileDownloader';
import { DownloadProgressTrackerMock } from '../../../../../../../tests/context/storage/StorageFiles/__mocks__/DownloadProgressTrackerMock';
import { DownloaderHandlerFactoryMock } from '../../../domain/download/__mocks__/DownloaderHandlerFactoryMock';
import { DownloaderHandlerMock } from '../../../domain/download/__mocks__/DownloaderHandlerMock';
import { StorageFile } from '../../../domain/StorageFile';
import { Readable } from 'stream';

describe('StorageFileDownloader', () => {
  let managerFactory: DownloaderHandlerFactoryMock;
  let tracker: DownloadProgressTrackerMock;

  let downloaderHandler: DownloaderHandlerMock;
  let sut: StorageFileDownloader;
  let file: StorageFile;
  let metadata: { name: string; type: string; size: number };

  beforeEach(() => {
    tracker = new DownloadProgressTrackerMock();
    managerFactory = new DownloaderHandlerFactoryMock();
    downloaderHandler = new DownloaderHandlerMock();
    managerFactory.downloader.mockReturnValue(downloaderHandler);
    sut = new StorageFileDownloader(managerFactory, tracker);

    file = StorageFile.from({
      id: '7b5d8a53-e166-48e7-90f21',
      virtualId: '2cdf3a31-4686-4981-8878-ef0f3f1850cf',
      size: 1024,
    });
    metadata = { name: 'testFile', type: 'txt', size: 1024 };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerEvents', () => {
    it('should handle start download', async () => {
      await sut.run(file, metadata);
      expect(downloaderHandler.on).toHaveBeenCalledWith('start', expect.any(Function));
    });

    it('should handle download progress', async () => {
      await sut.run(file, metadata);

      expect(downloaderHandler.on).toHaveBeenCalledWith('progress', expect.any(Function));
    });

    it('should handle download errors', async () => {
      await sut.run(file, metadata);

      expect(downloaderHandler.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should handle download finish', async () => {
      await sut.run(file, metadata);

      expect(downloaderHandler.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });
  });

  it('should successfully download a file', async () => {
    const mockStream = new Readable({
      read() {
        this.push('mock data');
        this.push(null);
      },
    });

    downloaderHandler.download.mockResolvedValue(mockStream);

    const stream = await sut.run(file, metadata);

    expect(stream).toBeInstanceOf(Readable);
    expect(downloaderHandler.download).toHaveBeenCalledWith(file);
  });
});

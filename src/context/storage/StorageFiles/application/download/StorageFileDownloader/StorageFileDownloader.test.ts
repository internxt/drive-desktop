
import { StorageFileDownloader } from './StorageFileDownloader';
import { DownloadProgressTrackerMock } from '../../../../../../../tests/context/storage/StorageFiles/__mocks__/DownloadProgressTrackerMock';
import {
  DownloaderHandlerFactoryMock
} from '../../../domain/download/__mocks__/DownloaderHandlerFactoryMock';
import { DownloaderHandlerMock } from '../../../domain/download/__mocks__/DownloaderHandlerMock';
import { StorageFile } from '../../../domain/StorageFile';
import { Readable } from 'stream';
import Logger from 'electron-log';

jest.mock('electron-log', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

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

    file = StorageFile.from({id: '7b5d8a53-e166-48e7-90f21', virtualId: '2cdf3a31-4686-4981-8878-ef0f3f1850cf', size: 1024});
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
      }
    });

    downloaderHandler.download.mockResolvedValue(mockStream);

    const stream = await sut.run(file, metadata);

    expect(stream).toBeInstanceOf(Readable);
    expect(downloaderHandler.download).toHaveBeenCalledWith(file);
  });

  describe('isFileDownloadable', () => {
    const fileContentsId = '7b5d8a53-e166-48e7-90f21';
    it('should return true if progress event is triggered', async () => {
      const resultPromise = sut.isFileDownloadable(fileContentsId);
      const progressHandler = downloaderHandler.on.mock.calls.find(([event]) => event === 'progress')?.[1];
      // @ts-ignore
      progressHandler(50, 1000);// Simulate progress event

      const result = await resultPromise;

      expect(result.isRight()).toBeTruthy();
      expect(result.getRight()).toEqual(true);
      expect(downloaderHandler.forceStop).toHaveBeenCalled();
    });

    it('should return false if file is not found', async () => {
      const resultPromise = sut.isFileDownloadable(fileContentsId);

      const errorHandler = downloaderHandler.on.mock.calls.find(([event]) => event === 'error')?.[1];
      // @ts-ignore
      errorHandler(new Error('404 Not Found')); // Simulate error event

      const result = await resultPromise;

      expect(result.isRight()).toBeTruthy();
      expect(result.getRight()).toEqual(false);
      expect(downloaderHandler.forceStop).toHaveBeenCalled();
    });

    it('should return left(error) for unexpected errors', async () => {
      const errorInstance = new Error('Unexpected network issue');
      const resultPromise = sut.isFileDownloadable(fileContentsId);

      const errorHandler = downloaderHandler.on.mock.calls.find(([event]) => event === 'error')?.[1];
      // @ts-ignore
      errorHandler(errorInstance); // Simulate an unexpected error

      const result = await resultPromise;

      expect(result.isLeft()).toBeTruthy();
      expect(result.getLeft()).toEqual(errorInstance);
      expect(downloaderHandler.forceStop).toHaveBeenCalled();
    });

    it('should return true if finish event is triggered', async () => {
      const resultPromise = sut.isFileDownloadable(fileContentsId);

      const finishHandler = downloaderHandler.on.mock.calls.find(([event]) => event === 'finish')?.[1];
      // @ts-ignore
      finishHandler(); // Simulate finish event

      const result = await resultPromise;

      expect(result.isRight()).toBeTruthy();
      expect(result.getRight()).toEqual(true);
      expect(downloaderHandler.forceStop).toHaveBeenCalled();
    });

    it('should handle exception inside the promise and return error', async () => {
      const error = new Error('Download failure');
      downloaderHandler.downloadById.mockRejectedValue(error);

      const result = await sut.isFileDownloadable(fileContentsId);

      expect(result.isLeft()).toBeTruthy();
      expect(result.getLeft()).toEqual(error);
    });
  });

  describe('registerEventsforIsFileDownloadable', () => {
    const fileContentsId = '7b5d8a53-e166-48e7-90f21';
    it('should log start event', () => {
      const resolveMock = jest.fn();
      sut.registerEventsforIsFileDownloadable(downloaderHandler, fileContentsId, resolveMock);

      const startHandler = downloaderHandler.on.mock.calls.find(([event]) => event === 'start')?.[1];
      // @ts-ignore
      startHandler();

      expect(Logger.info).toHaveBeenCalledWith(`Starting download for file ${fileContentsId}`);
    });

    it('should resolve right(true) and stop download when progress is detected', () => {
      const resolveMock = jest.fn();
      sut.registerEventsforIsFileDownloadable(downloaderHandler, fileContentsId, resolveMock);

      const progressHandler = downloaderHandler.on.mock.calls.find(([event]) => event === 'progress')?.[1];
      // @ts-ignore
      progressHandler(50, 1000);

      expect(Logger.info).toHaveBeenCalledWith(`File ${fileContentsId} is downloadable, stopping download...`);
      expect(resolveMock.mock.calls[0][0].isRight()).toBe(true);
      expect(resolveMock.mock.calls[0][0].getRight()).toBe(true);
      expect(downloaderHandler.forceStop).toHaveBeenCalled();
    });

    it('should resolve right(false) if error is 404', () => {
      const resolveMock = jest.fn();
      sut.registerEventsforIsFileDownloadable(downloaderHandler, fileContentsId, resolveMock);

      const errorHandler = downloaderHandler.on.mock.calls.find(([event]) => event === 'error')?.[1];

      // @ts-ignore
      errorHandler(new Error('404 Object not found'));

      expect(Logger.error).toHaveBeenCalledWith(expect.stringContaining('[DOWNLOAD CHECK] file not found'));
      expect(resolveMock.mock.calls[0][0].isRight()).toBe(true);
      expect(resolveMock.mock.calls[0][0].getRight()).toBe(false);
      expect(downloaderHandler.forceStop).toHaveBeenCalled();
    });

    it('should resolve left(error) if error uncontrolled', () => {
      const resolveMock = jest.fn();
      sut.registerEventsforIsFileDownloadable(downloaderHandler, fileContentsId, resolveMock);
      const error = new Error('could not connect to server');

      const errorHandler = downloaderHandler.on.mock.calls.find(([event]) => event === 'error')?.[1];

      // @ts-ignore
      errorHandler(error);

      expect(Logger.error).toHaveBeenCalledWith(expect.stringContaining('[DOWNLOAD CHECK] Uncontrolled Error downloading file'));
      expect(resolveMock.mock.calls[0][0].isLeft()).toBe(true);
      expect(resolveMock.mock.calls[0][0].getLeft()).toBe(error);
      expect(downloaderHandler.forceStop).toHaveBeenCalled();
    });

    it('should resolve right(true) when finish event is triggered', () => {
      const resolveMock = jest.fn();
      sut.registerEventsforIsFileDownloadable(downloaderHandler, fileContentsId, resolveMock);

      const finishHandler = downloaderHandler.on.mock.calls.find(([event]) => event === 'finish')?.[1];

      // @ts-ignore
      finishHandler();

      expect(Logger.info).toHaveBeenCalledWith(`File ${fileContentsId} finish downloading`);
      expect(resolveMock.mock.calls[0][0].isRight()).toBe(true);
      expect(resolveMock.mock.calls[0][0].getRight()).toBe(true);
      expect(downloaderHandler.forceStop).toHaveBeenCalled();
    });
  });
});

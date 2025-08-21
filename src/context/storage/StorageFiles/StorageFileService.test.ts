import { Readable } from 'stream';
import { StorageFileService } from './StorageFileService';
import { Environment } from '@internxt/inxt-js';
import { customSafeDownloader } from './infrastructure/download/customSafeDownloader';

jest.mock('./infrastructure/download/customSafeDownloader');
// Mock the Environment module
jest.mock('@internxt/inxt-js', () => {
  return {
    Environment: jest.fn().mockImplementation(() => ({
      config: {
        bridgeUrl: 'mock-url',
        bridgeUser: 'mock-user',
        bridgePass: 'mock-pass',
        encryptionKey: 'mock-key',
      },
      download: jest.fn(),
    })),
  };
});

describe('StorageFileService', () => {
  let environment: Environment;
  let bucket: string;
  let sut: StorageFileService;
  let mockStream: Readable;
  let mockedDownloader: jest.Mock;

  describe('isFileDownloadable', () => {
    const fileContentsId = '7b5d8a53-e166-48e7-90f21';

    beforeEach(() => {
      mockStream = new Readable({
        read() {
          // No-op
        },
      });
      environment = new Environment({
        bridgeUrl: 'test-bridge-url',
        bridgeUser: 'test-bridge-user',
        bridgePass: 'test-bridge-pass',
        encryptionKey: 'test-encryption-key',
        appDetails: {
          clientName: 'test-client',
          clientVersion: 'test-version',
          desktopHeader: 'test-header',
        },
      });
      bucket = 'test-bucket';
      mockedDownloader = jest.fn().mockReturnValue(mockStream);
      (customSafeDownloader as jest.Mock).mockReturnValue(mockedDownloader);
      sut = new StorageFileService(environment, bucket);
    });

    it('should return true if stream emits data', async () => {
      const resultPromise = sut.isFileDownloadable(fileContentsId);

      process.nextTick(() => {
        mockStream.emit('data', Buffer.from('hello world'));
      });

      const result = await resultPromise;

      expect(result.isRight()).toBeTruthy();
      expect(result.getRight()).toEqual(true);
    });

    it('should return false if file is not found', async () => {
      const resultPromise = sut.isFileDownloadable(fileContentsId);

      process.nextTick(() => {
        mockStream.emit('error', new Error('404 Not Found'));
      });

      const result = await resultPromise;

      expect(result.isRight()).toBeTruthy();
      expect(result.getRight()).toEqual(false);
    });

    it('should return left(error) for unexpected errors', async () => {
      const error = new Error('Unexpected error');
      const resultPromise = sut.isFileDownloadable(fileContentsId);

      process.nextTick(() => {
        mockStream.emit('error', error);
      });

      const result = await resultPromise;

      expect(result.isLeft()).toBeTruthy();
      expect(result.getLeft()).toEqual(error);
    });

    it('should return left(Error) if stream ends without receiving data', async () => {
      const resultPromise = sut.isFileDownloadable(fileContentsId);

      // Emit 'end' without emit any 'data'
      process.nextTick(() => {
        mockStream.emit('end');
      });

      const result = await resultPromise;

      expect(result.isLeft()).toBeTruthy();
      expect(result.getLeft()).toEqual(
        new Error('Stream ended but no data received')
      );
    });

    it('should handle exception inside the promise and return error', async () => {
      const error = new Error('Download failure');

      (customSafeDownloader as jest.Mock).mockReturnValue(() => {
        throw error;
      });

      sut = new StorageFileService(environment, bucket);
      const result = await sut.isFileDownloadable(fileContentsId);

      expect(result.isLeft()).toBeTruthy();
      expect(result.getLeft()).toEqual(error);
    });
  });
});

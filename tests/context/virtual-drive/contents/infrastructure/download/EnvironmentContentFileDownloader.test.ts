import { Readable } from 'stream';
import { FileMother } from '../../../files/domain/FileMother';
import { createDownloadStrategy } from '../../__mocks__/environment/DownloadStrategyFunctionMock';
import { EnvironmentContentFileDownloader } from '../../../../../../src/context/virtual-drive/contents/infrastructure/download/EnvironmentContentFileDownloader';

describe('Environment Content File Downloader', () => {
  const bucket = 'b51fd6af-cdac-51ec-b41c-21958aa4c2ae';
  const file = FileMother.any();

  describe('event emitter', () => {
    it('emits an event on start', async () => {
      const strategy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });

      const downloader = new EnvironmentContentFileDownloader(strategy, bucket);

      const handler = jest.fn();

      downloader.on('start', handler);

      await downloader.download(file);

      expect(handler).toBeCalled();
    });

    it('emits an event when the file is downloaded', async () => {
      const strategy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });

      const downloader = new EnvironmentContentFileDownloader(strategy, bucket);

      const handler = jest.fn();

      downloader.on('finish', handler);

      await downloader.download(file);

      expect(handler).toBeCalled();
    });

    it('emits an event when there is a progress update', async () => {
      const strategy = createDownloadStrategy((callbacks) => {
        callbacks.progressCallback(25);
        callbacks.progressCallback(50);
        callbacks.progressCallback(75);
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });

      const downloader = new EnvironmentContentFileDownloader(strategy, bucket);

      const handler = jest.fn();

      downloader.on('progress', handler);

      await downloader.download(file);

      const firstArgumentsOfProgress = handler.mock.calls.map(
        (args) => args[0]
      );

      expect(firstArgumentsOfProgress).toEqual(
        expect.arrayContaining([25, 50, 75])
      );
    });

    it('emits an event when there is an error', async () => {
      const errorMsg = 'Error uploading file';
      const strategy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(
          { message: errorMsg } as unknown as Error,
          Readable.from('')
        );
      });

      const downloader = new EnvironmentContentFileDownloader(strategy, bucket);

      downloader.on('error', (error: Error) => {
        expect(error.message).toBe(errorMsg);
      });

      await downloader.download(file).catch(() => {
        // no-op
      });
    });

    it('emits the error event before the promises fails', async () => {
      const errorMsg = 'Error uploading file';
      const strategy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(
          { message: errorMsg } as unknown as Error,
          Readable.from('')
        );
      });

      const downloader = new EnvironmentContentFileDownloader(strategy, bucket);

      const errorCallback = jest.fn();
      downloader.on('error', errorCallback);

      await downloader.download(file).catch(() => {
        expect(errorCallback).toBeCalled();
      });
    });
  });
});

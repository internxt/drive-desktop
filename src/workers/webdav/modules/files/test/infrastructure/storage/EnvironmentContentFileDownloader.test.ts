import { Readable } from 'stream';
import { EnvironmentContentFileDownloader } from '../../../infrastructure/storage/EnvironmentContnetFileDownloader';
import { WebdavFileMother } from '../../domain/WebdavFileMother';
import { createDownloadStrategy } from '../../__mocks__/environment/DownloadStratgeyFunctionMock';

describe('Environment Content File Downloader', () => {
  const bucket = 'b51fd6af-cdac-51ec-b41c-21958aa4c2ae';
  const file = WebdavFileMother.any();

  describe('event emitter', () => {
    it('emits an event on start', async () => {
      const strategy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });

      const downloader = new EnvironmentContentFileDownloader(
        strategy,
        bucket,
        file
      );

      const handler = jest.fn();

      downloader.on('start', handler);

      await downloader.download();

      expect(handler).toBeCalled();
    });

    it('emits an event when the file is downloaded', async () => {
      const strategy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });

      const downloader = new EnvironmentContentFileDownloader(
        strategy,
        bucket,
        file
      );

      const handler = jest.fn();

      downloader.on('finish', handler);

      await downloader.download();

      expect(handler).toBeCalled();
    });

    it('emits an event when there is a progress update', async () => {
      const strategy = createDownloadStrategy((callbacks) => {
        callbacks.progressCallback(25);
        callbacks.progressCallback(50);
        callbacks.progressCallback(75);
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });

      const downloader = new EnvironmentContentFileDownloader(
        strategy,
        bucket,
        file
      );

      const handler = jest.fn();

      downloader.on('progress', handler);

      await downloader.download();

      expect(handler.mock.calls).toEqual([[25], [50], [75]]);
    });

    it('emits an event when there is an error', async () => {
      const errorMsg = 'Error uploading file';
      const strategy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(
          { message: errorMsg } as unknown as Error,
          Readable.from('')
        );
      });

      const downloader = new EnvironmentContentFileDownloader(
        strategy,
        bucket,
        file
      );

      downloader.on('error', (error: Error) => {
        expect(error.message).toBe(errorMsg);
      });

      await downloader.download().catch(() => {
        // no-op
      });
    });
  });

  describe('time watcher', () => {
    it('starts the timer when the file is downloaded', async () => {
      const strategy = createDownloadStrategy((callbacks) => {
        callbacks.progressCallback(50);
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });

      const downloader = new EnvironmentContentFileDownloader(
        strategy,
        bucket,
        file
      );

      downloader.on('progress', () => {
        expect(downloader.elapsedTime()).toBeGreaterThan(-1);
      });

      expect(downloader.elapsedTime()).toBe(-1);

      await downloader.download();
    });

    it('stops the timer when the file is not downloaded', async () => {
      const delay = 100;
      const strategy = createDownloadStrategy((callbacks) => {
        callbacks.progressCallback(50);
        setTimeout(() => {
          callbacks.finishedCallback(
            null as unknown as Error,
            Readable.from('')
          );
        }, delay);
      });

      const downloader = new EnvironmentContentFileDownloader(
        strategy,
        bucket,
        file
      );

      await downloader.download();

      setTimeout(() => {
        expect(downloader.elapsedTime()).toBeGreaterThan(delay - 10);
        expect(downloader.elapsedTime()).toBeLessThan(delay + 10);
      }, delay);
    });
  });
});

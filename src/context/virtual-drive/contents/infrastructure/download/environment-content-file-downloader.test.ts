import { Readable } from 'stream';
import { FileMother } from '@/tests/context/virtual-drive/files/domain/FileMother';
import { createDownloadStrategy } from '@/tests/context/__mocks__/download-strategy-function-mock.helper.test';
import { EnvironmentContentFileDownloader } from './EnvironmentContentFileDownloader';

describe('Environment Content File Downloader', () => {
  const bucket = 'b51fd6af-cdac-51ec-b41c-21958aa4c2ae';
  const file = FileMother.any();

  describe('event emitter', () => {
    it('emits an event on start', async () => {
      const strategy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });

      const downloader = new EnvironmentContentFileDownloader(strategy, bucket);

      const handler = vi.fn();

      downloader.on('start', handler);

      await downloader.download(file);

      expect(handler).toBeCalled();
    });

    it('emits an event when the file is downloaded', async () => {
      const strategy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });

      const downloader = new EnvironmentContentFileDownloader(strategy, bucket);

      const handler = vi.fn();

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

      const handler = vi.fn();

      downloader.on('progress', handler);

      await downloader.download(file);

      expect(handler.mock.calls).toEqual([[25], [50], [75]]);
    });

    it('emits an event when there is an error', async () => {
      const errorMsg = 'Error uploading file';
      const strategy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback({ message: errorMsg } as unknown as Error, Readable.from(''));
      });

      const downloader = new EnvironmentContentFileDownloader(strategy, bucket);

      downloader.on('error', (error: Error) => {
        expect(error.message).toBe(errorMsg);
      });

      await downloader.download(file).catch(() => {
        // no-op
      });
    });
  });
});

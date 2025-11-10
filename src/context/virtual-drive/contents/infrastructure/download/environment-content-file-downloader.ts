import { Readable } from 'node:stream';
import { EnvironmentContentFileDownloader } from './EnvironmentContentFileDownloader';
import { Environment } from '@internxt/inxt-js';
import { mockDeep } from 'vitest-mock-extended';
import { ActionState, ActionTypes } from '@internxt/inxt-js/build/api';

describe('Environment Content File Downloader', () => {
  const environment = mockDeep<Environment>();
  const bucket = 'b51fd6af-cdac-51ec-b41c-21958aa4c2ae';
  const props = { contentsId: 'contentsId' };

  describe('event emitter', () => {
    it('emits an event on start', async () => {
      environment.download.mockImplementation((_, __, opts) => {
        opts.finishedCallback(null as unknown as Error, Readable.from(''));
        return new ActionState(ActionTypes.Download);
      });

      const downloader = new EnvironmentContentFileDownloader(environment, bucket);

      const handler = vi.fn();

      downloader.on('start', handler);

      await downloader.download(props);

      expect(handler).toBeCalled();
    });

    it('emits an event when the file is downloaded', async () => {
      environment.download.mockImplementation((_, __, opts) => {
        opts.finishedCallback(null as unknown as Error, Readable.from(''));
        return new ActionState(ActionTypes.Download);
      });

      const downloader = new EnvironmentContentFileDownloader(environment, bucket);

      const handler = vi.fn();

      downloader.on('finish', handler);

      await downloader.download(props);

      expect(handler).toBeCalled();
    });

    it('emits an event when there is a progress update', async () => {
      environment.download.mockImplementation((_, __, opts) => {
        opts.progressCallback(25, 0, 0);
        opts.progressCallback(50, 0, 0);
        opts.progressCallback(75, 0, 0);
        opts.finishedCallback(null as unknown as Error, Readable.from(''));
        return new ActionState(ActionTypes.Download);
      });

      const downloader = new EnvironmentContentFileDownloader(environment, bucket);

      const handler = vi.fn();

      downloader.on('progress', handler);

      await downloader.download(props);

      expect(handler.mock.calls).toEqual([[25], [50], [75]]);
    });

    it('emits an event when there is an error', async () => {
      const errorMsg = 'Error uploading file';
      environment.download.mockImplementation((_, __, opts) => {
        opts.finishedCallback({ message: errorMsg } as unknown as Error, Readable.from(''));
        return new ActionState(ActionTypes.Download);
      });

      const downloader = new EnvironmentContentFileDownloader(environment, bucket);

      downloader.on('error', (error: Error) => {
        expect(error.message).toBe(errorMsg);
      });

      await downloader.download(props).catch(() => {
        // no-op
      });
    });
  });
});

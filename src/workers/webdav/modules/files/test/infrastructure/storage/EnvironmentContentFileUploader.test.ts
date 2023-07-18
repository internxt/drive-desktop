import { Readable } from 'stream';
import { EnvironmentContentFileUpoader } from '../../../infrastructure/storage/EnvironmentContentFileUpoader';
import { createUploadStrategy } from '../../__mocks__/UploadStrategyFunciontMock';

describe('Environment Content File Uploader', () => {
  const valildFileSize = 1926506743;
  const bucket = 'c7d4d5e7-0850-52f4-8cbe-c3f746fb7d3f';

  describe('event emitter', () => {
    it('emits an event on start', async () => {
      const strategy = createUploadStrategy((opts) => {
        opts.finishedCallback(null, '3ebe8efe-c361-5269-b12d-c8a75c4cfcdd');
      });

      const uploader = new EnvironmentContentFileUpoader(
        strategy,
        bucket,
        valildFileSize,
        Promise.resolve(Readable.from(''))
      );

      const handler = jest.fn();

      uploader.on('start', handler);

      await uploader.upload();

      expect(handler).toBeCalled();
    });

    it('emits an event with an id when a file is uploaded', async () => {
      const uploadedFileId = 'd6f45f38-3316-5823-8182-bbbc31980643';
      const strategy = createUploadStrategy((opts) => {
        opts.finishedCallback(null, uploadedFileId);
      });

      const uploader = new EnvironmentContentFileUpoader(
        strategy,
        bucket,
        valildFileSize,
        Promise.resolve(Readable.from(''))
      );

      uploader.on('finish', (fileId: string) => {
        expect(fileId).toBe(uploadedFileId);
      });

      await uploader.upload();
    });

    it('emits an event when there is a progress update', async () => {
      const strategy = createUploadStrategy((opts) => {
        opts.progressCallback(25, 1, 4);
        opts.progressCallback(50, 2, 4);
        opts.progressCallback(75, 3, 4);
        opts.finishedCallback(null, 'baff69d3-379b-564f-9b1c-da657376b830');
      });

      const uploader = new EnvironmentContentFileUpoader(
        strategy,
        bucket,
        valildFileSize,
        Promise.resolve(Readable.from(''))
      );

      const handler = jest.fn();

      uploader.on('progress', handler);

      await uploader.upload();

      expect(handler.mock.calls).toEqual([[25], [50], [75]]);
    });

    it('emits an event when there is a progress update and finish on the end', async () => {
      const strategy = createUploadStrategy((opts) => {
        opts.progressCallback(50, 2, 4);
        opts.finishedCallback(null, 'baff69d3-379b-564f-9b1c-da657376b830');
      });

      const uploader = new EnvironmentContentFileUpoader(
        strategy,
        bucket,
        valildFileSize,
        Promise.resolve(Readable.from(''))
      );

      const progressHandler = jest.fn();
      const finishHandler = jest.fn();

      uploader.on('progress', progressHandler);

      uploader.on('finish', finishHandler);

      await uploader.upload();

      expect(progressHandler).toBeCalledWith(50);
      expect(finishHandler).toBeCalled();
    });

    it('emits an event when there is an error', async () => {
      const errorMsg = 'Error uploading file';
      const strategy = createUploadStrategy((opts) => {
        opts.finishedCallback({ message: errorMsg } as unknown as Error, null);
      });

      const uploader = new EnvironmentContentFileUpoader(
        strategy,
        bucket,
        valildFileSize,
        Promise.resolve(Readable.from(''))
      );

      uploader.on('error', (error: Error) => {
        expect(error.message).toBe(errorMsg);
      });

      await uploader.upload().catch(() => {
        // no-op
      });
    });
  });

  describe('time watcher', () => {
    it('starts the timer when the file is uploaded', async () => {
      const strategy = createUploadStrategy((opts) => {
        setTimeout(() => opts.progressCallback(50, 1, 4), 20);
        setTimeout(
          () =>
            opts.finishedCallback(null, '3ebe8efe-c361-5269-b12d-c8a75c4cfcdd'),
          100
        );
      });

      const uploader = new EnvironmentContentFileUpoader(
        strategy,
        bucket,
        valildFileSize,
        Promise.resolve(Readable.from(''))
      );

      uploader.on('progress', () => {
        expect(uploader.elapsedTime()).toBeGreaterThan(-1);
      });

      expect(uploader.elapsedTime()).toBe(-1);

      await uploader.upload();
    });

    it('stops the timer when the file is uploaded', async () => {
      const delay = 100;
      const strategy = createUploadStrategy((opts) => {
        setTimeout(
          () =>
            opts.finishedCallback(null, '3ebe8efe-c361-5269-b12d-c8a75c4cfcdd'),
          delay
        );
      });

      const uploader = new EnvironmentContentFileUpoader(
        strategy,
        bucket,
        valildFileSize,
        Promise.resolve(Readable.from(''))
      );

      await uploader.upload();

      expect(uploader.elapsedTime()).toBeGreaterThan(delay - 10);
      expect(uploader.elapsedTime()).toBeLessThan(delay + 10);
    });
  });
});

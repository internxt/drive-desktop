import { Readable } from 'stream';
import { ContentsIdMother } from '@/tests/context/virtual-drive/contents/domain/ContentsIdMother';
import { createUploadStrategy } from '@/tests/context/__mocks__/upload-strategy-function-mock.helper.test';
import { EnvironmentContentFileUploader } from './EnvironmentContentFileUploader';

describe('Environment Content File Uploader', () => {
  const validFileSize = 1926506743;
  const bucket = 'c7d4d5e7-0850-52f4-8cbe-c3f746fb7d3f';
  const abortSignal = new AbortController().signal;

  describe('event emitter', () => {
    it('emits an event on start', async () => {
      const strategy = createUploadStrategy((opts) => {
        opts.finishedCallback(null, ContentsIdMother.raw());
      });

      const uploader = new EnvironmentContentFileUploader(strategy, bucket);

      const handler = vi.fn();

      uploader.on('start', handler);

      await uploader.upload({
        contents: Readable.from(''),
        size: validFileSize,
        path: '',
        abortSignal,
      });

      expect(handler).toBeCalled();
    });

    it('emits an event with an id when a file is uploaded', async () => {
      const uploadedFileId = ContentsIdMother.raw();
      const strategy = createUploadStrategy((opts) => {
        opts.finishedCallback(null, uploadedFileId);
      });

      const uploader = new EnvironmentContentFileUploader(strategy, bucket);

      uploader.on('finish', (fileId: string) => {
        expect(fileId).toBe(uploadedFileId);
      });

      await uploader.upload({
        contents: Readable.from(''),
        size: validFileSize,
        path: '',
        abortSignal,
      });
    });

    it('emits an event when there is a progress update', async () => {
      const strategy = createUploadStrategy((opts) => {
        opts.progressCallback(25, 1, 4);
        opts.progressCallback(50, 2, 4);
        opts.progressCallback(75, 3, 4);
        opts.finishedCallback(null, ContentsIdMother.raw());
      });

      const uploader = new EnvironmentContentFileUploader(strategy, bucket);

      const handler = vi.fn();

      uploader.on('progress', handler);

      await uploader.upload({
        contents: Readable.from(''),
        size: validFileSize,
        path: '',
        abortSignal,
      });

      expect(handler.mock.calls).toEqual([[25], [50], [75]]);
    });

    it('emits an event when there is a progress update and finish on the end', async () => {
      const strategy = createUploadStrategy((opts) => {
        opts.progressCallback(50, 2, 4);
        opts.finishedCallback(null, ContentsIdMother.raw());
      });

      const uploader = new EnvironmentContentFileUploader(strategy, bucket);

      const progressHandler = vi.fn();
      const finishHandler = vi.fn();

      uploader.on('progress', progressHandler);

      uploader.on('finish', finishHandler);

      await uploader.upload({
        contents: Readable.from(''),
        size: validFileSize,
        path: '',
        abortSignal,
      });

      expect(progressHandler).toBeCalledWith(50);
      expect(finishHandler).toBeCalled();
    });

    it('emits an event when there is an error', async () => {
      const errorMsg = 'Error uploading file';
      const strategy = createUploadStrategy((opts) => {
        opts.finishedCallback({ message: errorMsg } as unknown as Error, null);
      });

      const uploader = new EnvironmentContentFileUploader(strategy, bucket);

      uploader.on('error', (error: Error) => {
        expect(error.message).toBe(errorMsg);
      });

      await uploader
        .upload({
          contents: Readable.from(''),
          size: validFileSize,
          path: '',
          abortSignal,
        })
        .catch(() => {
          // no-op
        });
    });
  });

  describe('time watcher', () => {
    it('starts the timer when the file is uploaded', async () => {
      const strategy = createUploadStrategy((opts) => {
        setTimeout(() => opts.progressCallback(50, 1, 4), 20);
        setTimeout(() => opts.finishedCallback(null, ContentsIdMother.raw()), 100);
      });

      const uploader = new EnvironmentContentFileUploader(strategy, bucket);

      uploader.on('progress', () => {
        expect(uploader.elapsedTime()).toBeGreaterThan(-1);
      });

      expect(uploader.elapsedTime()).toBe(-1);

      await uploader.upload({
        contents: Readable.from(''),
        size: validFileSize,
        path: '',
        abortSignal,
      });
    });

    it('stops the timer when the file is uploaded', async () => {
      const delay = 1000;
      const strategy = createUploadStrategy((opts) => {
        setTimeout(() => opts.finishedCallback(null, ContentsIdMother.raw()), delay);
      });

      const uploader = new EnvironmentContentFileUploader(strategy, bucket);

      await uploader.upload({
        contents: Readable.from(''),
        size: validFileSize,
        path: '',
        abortSignal,
      });

      setTimeout(() => {
        expect(uploader.elapsedTime()).toBeGreaterThan(delay - 10);
        expect(uploader.elapsedTime()).toBeLessThan(delay + 10);
      }, delay);
    });
  });
});

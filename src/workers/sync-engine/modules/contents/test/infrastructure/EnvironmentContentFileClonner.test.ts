import { Readable } from 'stream';
import { FileMother } from '../../../files/test/domain/FileMother';
import { EnvironmentContentFileCloner } from '../../infrastructure/EnvironmentContentFileCloner';
import { ContentsIdMother } from '../domain/ContentsIdMother';
import { createDownloadStrategy } from '../__mocks__/environment/DownloadStrategyFunctionMock';
import { createUploadStrategy } from '../__mocks__/environment/UploadStrategyFunctionMock';

describe('Environment Content File Cloner', () => {
  const bucket = 'b1d067f9-d0a9-5e24-96f5-81c116f7f254';
  const file = FileMother.any();

  describe('event emitter', () => {
    it('emits an event when a file is cloned', async () => {
      const downloadStrategy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });
      const uploadStrategy = createUploadStrategy((callbacks) => {
        callbacks.finishedCallback(null, ContentsIdMother.raw());
      });

      const cloner = new EnvironmentContentFileCloner(
        uploadStrategy,
        downloadStrategy,
        bucket,
        file
      );

      const handler = jest.fn();

      cloner.on('start', handler);

      await cloner.clone();

      expect(handler).toBeCalled();
    });

    it('emits an event with a file id when a file is cloned', async () => {
      const uploadedFileId = ContentsIdMother.random();

      const downloadStrategy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });
      const uploadStrategy = createUploadStrategy((callbacks) => {
        callbacks.finishedCallback(null, uploadedFileId.value);
      });

      const cloner = new EnvironmentContentFileCloner(
        uploadStrategy,
        downloadStrategy,
        bucket,
        file
      );

      const handler = jest.fn();

      cloner.on('finish', handler);

      await cloner.clone();

      expect(handler).toBeCalledWith(uploadedFileId);
    });

    it('emits an event when the file is being downloaded', async () => {
      const downloadStrategy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });
      const uploadStrategy = createUploadStrategy((callbacks) => {
        callbacks.finishedCallback(null, ContentsIdMother.raw());
      });

      const cloner = new EnvironmentContentFileCloner(
        uploadStrategy,
        downloadStrategy,
        bucket,
        file
      );

      const handler = jest.fn();

      cloner.on('start-download', handler);

      await cloner.clone();

      expect(handler).toBeCalled();
    });

    it('emits an event when there is a progress update on download', async () => {
      const downloadStrategy = createDownloadStrategy((callbacks) => {
        callbacks.progressCallback(25);
        callbacks.progressCallback(50);
        callbacks.progressCallback(75);
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });
      const uploadStrategy = createUploadStrategy((callbacks) => {
        callbacks.finishedCallback(null, ContentsIdMother.raw());
      });

      const cloner = new EnvironmentContentFileCloner(
        uploadStrategy,
        downloadStrategy,
        bucket,
        file
      );

      const handler = jest.fn();

      cloner.on('download-progress', handler);

      await cloner.clone();

      expect(handler.mock.calls).toEqual([[25], [50], [75]]);
    });

    it('emits an event when the file has been downloaded', async () => {
      const downloadStrategy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });
      const uploadStrategy = createUploadStrategy((callbacks) => {
        callbacks.finishedCallback(null, ContentsIdMother.raw());
      });

      const cloner = new EnvironmentContentFileCloner(
        uploadStrategy,
        downloadStrategy,
        bucket,
        file
      );

      const handler = jest.fn();

      cloner.on('download-finished', handler);

      await cloner.clone();

      expect(handler).toHaveBeenCalled();
    });

    it('emits an event when the upload starts', async () => {
      const downloadStrategy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });
      const uploadStrategy = createUploadStrategy((callbacks) => {
        callbacks.finishedCallback(null, ContentsIdMother.raw());
      });

      const cloner = new EnvironmentContentFileCloner(
        uploadStrategy,
        downloadStrategy,
        bucket,
        file
      );

      const handler = jest.fn();

      cloner.on('start-upload', handler);

      await cloner.clone();

      expect(handler).toHaveBeenCalled();
    });

    it('emits an event when the is an upload progress update', async () => {
      const downloadStrategy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });
      const uploadStrategy = createUploadStrategy((callbacks) => {
        callbacks.progressCallback(25, 1, 4);
        callbacks.progressCallback(50, 2, 4);
        callbacks.progressCallback(75, 3, 4);
        callbacks.finishedCallback(null, ContentsIdMother.raw());
      });

      const cloner = new EnvironmentContentFileCloner(
        uploadStrategy,
        downloadStrategy,
        bucket,
        file
      );

      const handler = jest.fn();

      cloner.on('upload-progress', handler);

      await cloner.clone();

      expect(handler).toHaveBeenCalled();
    });

    it('emits an event when the file has been uploaded', async () => {
      const downloadStrategy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });
      const uploadStrategy = createUploadStrategy((callbacks) => {
        callbacks.finishedCallback(null, ContentsIdMother.raw());
      });

      const cloner = new EnvironmentContentFileCloner(
        uploadStrategy,
        downloadStrategy,
        bucket,
        file
      );

      const handler = jest.fn();

      cloner.on('upload-finished', handler);

      await cloner.clone();

      expect(handler).toHaveBeenCalled();
    });

    it('emits an event when a file has been cloned', async () => {
      const downloadStrategy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });
      const uploadStrategy = createUploadStrategy((callbacks) => {
        callbacks.finishedCallback(null, ContentsIdMother.raw());
      });

      const cloner = new EnvironmentContentFileCloner(
        uploadStrategy,
        downloadStrategy,
        bucket,
        file
      );

      const handler = jest.fn();

      cloner.on('finish', handler);

      await cloner.clone();

      expect(handler).toHaveBeenCalled();
    });

    it('does not emit finish events or start upload when an error event has been emitted on download', async () => {
      const message = 'error downloading';

      const downloadStrategy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(
          { message } as unknown as Error,
          null as unknown as Readable
        );
      });

      const uploadFunction = jest.fn();

      const uploadStrategy = createUploadStrategy(uploadFunction);

      const cloner = new EnvironmentContentFileCloner(
        uploadStrategy,
        downloadStrategy,
        bucket,
        file
      );

      const finishHandler = jest.fn();
      const startUploadHandler = jest.fn();
      const errorHandler = jest.fn();

      cloner.on('error', errorHandler);
      cloner.on('finish', finishHandler);
      cloner.on('start-upload', finishHandler);

      await cloner.clone().catch(() => {
        // no-op
      });

      expect(errorHandler).toHaveBeenCalled();
      expect(finishHandler).not.toHaveBeenCalled();
      expect(startUploadHandler).not.toHaveBeenCalled();
    });

    it('does not emit finish events when an error event has been emitted on upload', async () => {
      const message = 'error uploading';

      const downloadStrategy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });

      const uploadStrategy = createUploadStrategy((callbacks) => {
        callbacks.finishedCallback(
          { message } as unknown as Error,
          null as unknown as string
        );
      });

      const cloner = new EnvironmentContentFileCloner(
        uploadStrategy,
        downloadStrategy,
        bucket,
        file
      );

      const errorHandler = jest.fn();
      const startUploadHandler = jest.fn();
      const finishHandler = jest.fn();

      cloner.on('error', errorHandler);
      cloner.on('finish', finishHandler);
      cloner.on('start-upload', startUploadHandler);

      await cloner.clone().catch(() => {
        // no-op
      });

      expect(errorHandler).toHaveBeenCalled();
      expect(startUploadHandler).toHaveBeenCalled();
      expect(finishHandler).not.toHaveBeenCalled();
    });
  });

  describe('time watcher', () => {
    it('starts the timer when the file is being downloaded', async () => {
      const downloadStrategy = createDownloadStrategy((callbacks) => {
        setTimeout(() => callbacks.progressCallback(50), 20);
        setTimeout(
          () =>
            callbacks.finishedCallback(
              null as unknown as Error,
              Readable.from('')
            ),
          100
        );
      });
      const uploadStrategy = createUploadStrategy((callbacks) => {
        callbacks.finishedCallback(null, ContentsIdMother.raw());
      });

      const cloner = new EnvironmentContentFileCloner(
        uploadStrategy,
        downloadStrategy,
        bucket,
        file
      );

      cloner.on('download-progress', () => {
        expect(cloner.elapsedTime()).toBeGreaterThan(-1);
      });

      expect(cloner.elapsedTime()).toBe(-1);

      await cloner.clone();
    });

    it('stops the stopwatch when the file has been uploaded', async () => {
      const delay = 100;

      const downloadStrategy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });
      const uploadStrategy = createUploadStrategy((callbacks) => {
        setTimeout(
          () => callbacks.finishedCallback(null, ContentsIdMother.raw()),
          delay
        );
      });

      const cloner = new EnvironmentContentFileCloner(
        uploadStrategy,
        downloadStrategy,
        bucket,
        file
      );

      await cloner.clone();

      setTimeout(() => {
        expect(cloner.elapsedTime()).toBeGreaterThan(delay - 10);
        expect(cloner.elapsedTime()).toBeLessThan(delay + 10);
      }, delay);
    });

    it.skip('stops the stopwatch when  an error occurs during the download', async () => {
      const delay = 100;
      let elapsedTimeOnError: number;

      const downloadStrategy = createDownloadStrategy((callbacks) => {
        setTimeout(() => callbacks.progressCallback(50), 20);
        setTimeout(
          () =>
            callbacks.finishedCallback(
              { message: 'error downloading ' } as unknown as Error,
              null as unknown as Readable
            ),
          delay
        );
      });
      const uploadStrategy = createUploadStrategy((callbacks) => {
        setTimeout(
          () => callbacks.finishedCallback(null, ContentsIdMother.raw()),
          delay
        );
      });

      const cloner = new EnvironmentContentFileCloner(
        uploadStrategy,
        downloadStrategy,
        bucket,
        file
      );

      cloner.on('error', () => {
        elapsedTimeOnError = cloner.elapsedTime();
      });

      await cloner.clone().catch(() => {
        // no-op
      });

      setTimeout(() => {
        expect(cloner.elapsedTime()).toBeGreaterThan(elapsedTimeOnError - 5);
        expect(cloner.elapsedTime()).toBeLessThan(elapsedTimeOnError + 5);
      }, delay);
    });

    it.skip('stops the stopwatch when an error occurs during the upload', async () => {
      const delay = 100;
      let elapsedTimeOnError: number;

      const downloadStrategy = createDownloadStrategy((callbacks) => {
        setTimeout(
          () =>
            callbacks.finishedCallback(
              null as unknown as Error,
              Readable.from('')
            ),
          delay
        );
      });
      const uploadStrategy = createUploadStrategy((callbacks) => {
        setTimeout(
          () =>
            callbacks.finishedCallback(
              { message: 'error uploading ' } as unknown as Error,
              null as unknown as string
            ),
          delay
        );
      });

      const cloner = new EnvironmentContentFileCloner(
        uploadStrategy,
        downloadStrategy,
        bucket,
        file
      );

      cloner.on('error', () => {
        elapsedTimeOnError = cloner.elapsedTime();
      });

      await cloner.clone().catch(() => {
        // no-op
      });

      setTimeout(() => {
        expect(cloner.elapsedTime()).toBeGreaterThan(elapsedTimeOnError - 5);
        expect(cloner.elapsedTime()).toBeLessThan(elapsedTimeOnError + 5);
      }, delay);
    });
  });
});

import { Readable } from 'stream';
import { EnvironmentContentFileClonner } from '../../../infrastructure/content/EnvironmentContentFileClonner';
import { WebdavFileMother } from '../../domain/WebdavFileMother';
import { createDownloadStrategy } from '../../__mocks__/environment/DownloadStratgeyFunctionMock';
import { createUploadStrategy } from '../../__mocks__/environment/UploadStrategyFunciontMock';

describe('Environment Content File Clonner', () => {
  const bucket = 'b1d067f9-d0a9-5e24-96f5-81c116f7f254';
  const file = WebdavFileMother.any();

  describe('event emitter', () => {
    it('emits an event when a file is cloned', async () => {
      const downloadStragegy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });
      const uploadStrategy = createUploadStrategy((callbacks) => {
        callbacks.finishedCallback(
          null,
          '3ebe8efe-c361-5269-b12d-c8a75c4cfcdd'
        );
      });

      const clonner = new EnvironmentContentFileClonner(
        uploadStrategy,
        downloadStragegy,
        bucket,
        file
      );

      const handler = jest.fn();

      clonner.on('start', handler);

      await clonner.clone();

      expect(handler).toBeCalled();
    });

    it('emits an event with a file id when a file is cloned', async () => {
      const uploadedFileId = 'e8a24566-38da-5011-8d5c-46f478f9ddd0';

      const downloadStragegy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });
      const uploadStrategy = createUploadStrategy((callbacks) => {
        callbacks.finishedCallback(null, uploadedFileId);
      });

      const clonner = new EnvironmentContentFileClonner(
        uploadStrategy,
        downloadStragegy,
        bucket,
        file
      );

      const handler = jest.fn();

      clonner.on('finish', handler);

      await clonner.clone();

      expect(handler).toBeCalledWith(uploadedFileId);
    });

    it('emits an event when the file is being downloaded', async () => {
      const downloadStragegy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });
      const uploadStrategy = createUploadStrategy((callbacks) => {
        callbacks.finishedCallback(
          null,
          '4c3f80fb-5eb7-5d3b-8b00-15328a1c4f5f'
        );
      });

      const clonner = new EnvironmentContentFileClonner(
        uploadStrategy,
        downloadStragegy,
        bucket,
        file
      );

      const handler = jest.fn();

      clonner.on('start-download', handler);

      await clonner.clone();

      expect(handler).toBeCalled();
    });

    it('emits an event when there is a progress update on download', async () => {
      const downloadStragegy = createDownloadStrategy((callbacks) => {
        callbacks.progressCallback(25);
        callbacks.progressCallback(50);
        callbacks.progressCallback(75);
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });
      const uploadStrategy = createUploadStrategy((callbacks) => {
        callbacks.finishedCallback(
          null,
          '4c3f80fb-5eb7-5d3b-8b00-15328a1c4f5f'
        );
      });

      const clonner = new EnvironmentContentFileClonner(
        uploadStrategy,
        downloadStragegy,
        bucket,
        file
      );

      const handler = jest.fn();

      clonner.on('download-progress', handler);

      await clonner.clone();

      expect(handler.mock.calls).toEqual([[25], [50], [75]]);
    });

    it('emits an event when the file has been downloaded', async () => {
      const downloadStragegy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });
      const uploadStrategy = createUploadStrategy((callbacks) => {
        callbacks.finishedCallback(
          null,
          '4c3f80fb-5eb7-5d3b-8b00-15328a1c4f5f'
        );
      });

      const clonner = new EnvironmentContentFileClonner(
        uploadStrategy,
        downloadStragegy,
        bucket,
        file
      );

      const handler = jest.fn();

      clonner.on('download-finished', handler);

      await clonner.clone();

      expect(handler).toHaveBeenCalled();
    });

    it('emits an event when the upload starts', async () => {
      const downloadStragegy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });
      const uploadStrategy = createUploadStrategy((callbacks) => {
        callbacks.finishedCallback(
          null,
          '4c3f80fb-5eb7-5d3b-8b00-15328a1c4f5f'
        );
      });

      const clonner = new EnvironmentContentFileClonner(
        uploadStrategy,
        downloadStragegy,
        bucket,
        file
      );

      const handler = jest.fn();

      clonner.on('start-upload', handler);

      await clonner.clone();

      expect(handler).toHaveBeenCalled();
    });

    it('emits an event when the is an upload progress update', async () => {
      const downloadStragegy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });
      const uploadStrategy = createUploadStrategy((callbacks) => {
        callbacks.progressCallback(25, 1, 4);
        callbacks.progressCallback(50, 2, 4);
        callbacks.progressCallback(75, 3, 4);
        callbacks.finishedCallback(
          null,
          '4c3f80fb-5eb7-5d3b-8b00-15328a1c4f5f'
        );
      });

      const clonner = new EnvironmentContentFileClonner(
        uploadStrategy,
        downloadStragegy,
        bucket,
        file
      );

      const handler = jest.fn();

      clonner.on('upload-progress', handler);

      await clonner.clone();

      expect(handler).toHaveBeenCalled();
    });

    it('emits an event when the file has been uploaded', async () => {
      const downloadStragegy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });
      const uploadStrategy = createUploadStrategy((callbacks) => {
        callbacks.finishedCallback(
          null,
          '4c3f80fb-5eb7-5d3b-8b00-15328a1c4f5f'
        );
      });

      const clonner = new EnvironmentContentFileClonner(
        uploadStrategy,
        downloadStragegy,
        bucket,
        file
      );

      const handler = jest.fn();

      clonner.on('upload-finished', handler);

      await clonner.clone();

      expect(handler).toHaveBeenCalled();
    });

    it('emits an event when a file has been cloned', async () => {
      const downloadStragegy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });
      const uploadStrategy = createUploadStrategy((callbacks) => {
        callbacks.finishedCallback(
          null,
          '4c3f80fb-5eb7-5d3b-8b00-15328a1c4f5f'
        );
      });

      const clonner = new EnvironmentContentFileClonner(
        uploadStrategy,
        downloadStragegy,
        bucket,
        file
      );

      const handler = jest.fn();

      clonner.on('finish', handler);

      await clonner.clone();

      expect(handler).toHaveBeenCalled();
    });

    it('does not emit finish events or start upload when an error event has been emitted on download', async () => {
      const message = 'error downloading';

      const downloadStragegy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(
          { message } as unknown as Error,
          null as unknown as Readable
        );
      });

      const uploadFunction = jest.fn();

      const uploadStrategy = createUploadStrategy(uploadFunction);

      const clonner = new EnvironmentContentFileClonner(
        uploadStrategy,
        downloadStragegy,
        bucket,
        file
      );

      const finishHandler = jest.fn();
      const startUploadHandler = jest.fn();
      const errorHandler = jest.fn();

      clonner.on('error', errorHandler);
      clonner.on('finish', finishHandler);
      clonner.on('start-upload', finishHandler);

      await clonner.clone().catch(() => {
        // no-op
      });

      expect(errorHandler).toHaveBeenCalled();
      expect(finishHandler).not.toHaveBeenCalled();
      expect(startUploadHandler).not.toHaveBeenCalled();
    });

    it('does not emit finish events when an error event has been emitted on upload', async () => {
      const message = 'error uploading';

      const downloadStragegy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });

      const uploadStrategy = createUploadStrategy((callbacks) => {
        callbacks.finishedCallback(
          { message } as unknown as Error,
          null as unknown as string
        );
      });

      const clonner = new EnvironmentContentFileClonner(
        uploadStrategy,
        downloadStragegy,
        bucket,
        file
      );

      const errorHandler = jest.fn();
      const startUploadHandler = jest.fn();
      const finishHandler = jest.fn();

      clonner.on('error', errorHandler);
      clonner.on('finish', finishHandler);
      clonner.on('start-upload', startUploadHandler);

      await clonner.clone().catch(() => {
        // no-op
      });

      expect(errorHandler).toHaveBeenCalled();
      expect(startUploadHandler).toHaveBeenCalled();
      expect(finishHandler).not.toHaveBeenCalled();
    });
  });

  describe('time watcher', () => {
    it('starts the timer when the file is being downloaded', async () => {
      const downloadStragegy = createDownloadStrategy((callbacks) => {
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
        callbacks.finishedCallback(
          null,
          '3ebe8efe-c361-5269-b12d-c8a75c4cfcdd'
        );
      });

      const clonner = new EnvironmentContentFileClonner(
        uploadStrategy,
        downloadStragegy,
        bucket,
        file
      );

      clonner.on('download-progress', () => {
        expect(clonner.elapsedTime()).toBeGreaterThan(-1);
      });

      expect(clonner.elapsedTime()).toBe(-1);

      await clonner.clone();
    });

    it('stops the stopwatch when the file has been uploaded', async () => {
      const delay = 100;

      const downloadStragegy = createDownloadStrategy((callbacks) => {
        callbacks.finishedCallback(null as unknown as Error, Readable.from(''));
      });
      const uploadStrategy = createUploadStrategy((callbacks) => {
        setTimeout(
          () =>
            callbacks.finishedCallback(
              null,
              '3ebe8efe-c361-5269-b12d-c8a75c4cfcdd'
            ),
          delay
        );
      });

      const clonner = new EnvironmentContentFileClonner(
        uploadStrategy,
        downloadStragegy,
        bucket,
        file
      );

      await clonner.clone();

      setTimeout(() => {
        expect(clonner.elapsedTime()).toBeGreaterThan(delay - 10);
        expect(clonner.elapsedTime()).toBeLessThan(delay + 10);
      }, delay);
    });

    it('stops the stopwatch when an error occurs during the download', async () => {
      const delay = 100;
      let elapsedTimeOnError: number;

      const downloadStragegy = createDownloadStrategy((callbacks) => {
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
          () =>
            callbacks.finishedCallback(
              null,
              '3ebe8efe-c361-5269-b12d-c8a75c4cfcdd'
            ),
          delay
        );
      });

      const clonner = new EnvironmentContentFileClonner(
        uploadStrategy,
        downloadStragegy,
        bucket,
        file
      );

      clonner.on('error', () => {
        elapsedTimeOnError = clonner.elapsedTime();
      });

      await clonner.clone().catch(() => {
        // no-op
      });

      setTimeout(() => {
        expect(clonner.elapsedTime()).toBeGreaterThan(elapsedTimeOnError - 5);
        expect(clonner.elapsedTime()).toBeLessThan(elapsedTimeOnError + 5);
      }, delay);
    });

    it('stops the stopwatch when an error occurs during the upload', async () => {
      const delay = 100;
      let elapsedTimeOnError: number;

      const downloadStragegy = createDownloadStrategy((callbacks) => {
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

      const clonner = new EnvironmentContentFileClonner(
        uploadStrategy,
        downloadStragegy,
        bucket,
        file
      );

      clonner.on('error', () => {
        elapsedTimeOnError = clonner.elapsedTime();
      });

      await clonner.clone().catch(() => {
        // no-op
      });

      setTimeout(() => {
        expect(clonner.elapsedTime()).toBeGreaterThan(elapsedTimeOnError - 5);
        expect(clonner.elapsedTime()).toBeLessThan(elapsedTimeOnError + 5);
      }, delay);
    });
  });
});

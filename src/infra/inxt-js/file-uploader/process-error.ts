import { logger } from '@/apps/shared/logger/logger';
import { FileUploaderCallbacks } from './file-uploader';

export class EnvironmentFileUploaderError extends Error {
  constructor(
    public readonly code: 'ABORTED' | 'NOT_ENOUGH_SPACE' | 'FILE_MODIFIED' | 'UNKNOWN',
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}

type TProps = {
  path: string;
  err: Error | null;
  callbacks: FileUploaderCallbacks;
};

export function processError({ path, err, callbacks }: TProps) {
  if (err) {
    if (err.message === 'Process killed by user') {
      return new EnvironmentFileUploaderError('ABORTED', err);
    }

    callbacks.onError();

    if (err.message === 'Max space used') {
      logger.warn({
        msg: 'Failed to upload file to the bucket. Not enough space',
        path,
        error: err,
      });

      return new EnvironmentFileUploaderError('NOT_ENOUGH_SPACE', err);
    }

    logger.error({
      msg: 'Failed to upload file to the bucket',
      path,
      error: err,
    });
  }

  return new EnvironmentFileUploaderError('UNKNOWN', err);
}

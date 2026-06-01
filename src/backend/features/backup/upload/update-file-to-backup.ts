import { Environment } from '@internxt/inxt-js';
import { DriveDesktopError } from '../../../../context/shared/domain/errors/DriveDesktopError';
import { Result } from '../../../../context/shared/domain/Result';
import { uploadContentToEnvironment } from './upload-content-to-environment';
import { retryWithBackoff } from '../../../../shared/retry-with-backoff';
import { createTransientErrorHandler } from '../../../../backend/common/rate-limit/transient-error-handler';
import { overrideFileToBackend } from './override-file-to-backend';

export type UpdateFileParams = {
  path: string;
  size: number;
  bucket: string;
  fileUuid: string;
  environment: Environment;
  signal: AbortSignal;
};

async function updateFile(file: UpdateFileParams): Promise<Result<void, DriveDesktopError>> {
  const { data: contentsId, error } = await retryWithBackoff(
    () =>
      uploadContentToEnvironment({
        path: file.path,
        size: file.size,
        bucket: file.bucket,
        environment: file.environment,
        signal: file.signal,
      }),
    createTransientErrorHandler({ tag: 'BACKUPS', context: 'BACKUP UPLOAD RETRY', path: file.path }),
    file.signal,
  );

  if (error) {
    return { error };
  }

  if (file.signal.aborted) {
    return { data: undefined };
  }

  const overrideResult = await retryWithBackoff(
    () =>
      overrideFileToBackend({
        fileUuid: file.fileUuid,
        fileContentsId: contentsId,
        fileSize: file.size,
      }),
    createTransientErrorHandler({ tag: 'BACKUPS', context: 'BACKUP UPLOAD RETRY', path: file.path }),
    file.signal,
  );

  if (overrideResult.error) {
    return { error: overrideResult.error };
  }

  return { data: undefined };
}

export async function updateFileToBackup(file: UpdateFileParams): Promise<Result<void, DriveDesktopError>> {
  return updateFile(file);
}

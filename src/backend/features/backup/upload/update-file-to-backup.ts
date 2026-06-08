import { Environment } from '@internxt/inxt-js';
import { DriveDesktopError } from '../../../../context/shared/domain/errors/DriveDesktopError';
import { Result } from '../../../../context/shared/domain/Result';
import { uploadContentToEnvironment } from './upload-content-to-environment';
import { retryWithBackoff } from '../../../../shared/retry-with-backoff';
import { createTransientErrorHandler } from '../../../../backend/common/rate-limit/transient-error-handler';
import { overrideFileToBackend } from './override-file-to-backend';
import configStore from '../../../../apps/main/config';
import { addMaxFileSizeRejection } from '../../user/file-size-limit/add-max-file-size-rejection';
import { validateUploadFileSize } from '../../user/file-size-limit/validate-upload-file-size';

export type UpdateFileParams = {
  path: string;
  size: number;
  bucket: string;
  fileUuid: string;
  environment: Environment;
  signal: AbortSignal;
};

async function updateFile(file: UpdateFileParams): Promise<Result<void, DriveDesktopError>> {
  const validation = validateUploadFileSize({
    size: file.size,
    maxUploadFileSize: configStore.get('maxUploadFileSizeInBytes'),
  });

  if (!validation.allowed) {
    addMaxFileSizeRejection({ path: file.path, fileSize: file.size, validation, blockUploadPath: false });
    return { data: undefined };
  }

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
    if (overrideResult.error.cause === 'FILE_TOO_BIG') {
      addMaxFileSizeRejection({ path: file.path, fileSize: file.size, blockUploadPath: false });
      return { data: undefined };
    }

    return { error: overrideResult.error };
  }

  return { data: undefined };
}

export async function updateFileToBackup(file: UpdateFileParams): Promise<Result<void, DriveDesktopError>> {
  return updateFile(file);
}

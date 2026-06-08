import { Environment } from '@internxt/inxt-js';
import { DriveDesktopError } from '../../../../context/shared/domain/errors/DriveDesktopError';
import { File } from '../../../../context/virtual-drive/files/domain/File';
import { createFileToBackend } from './create-file-to-backend';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { uploadContentToEnvironment } from './upload-content-to-environment';
import { Result } from '../../../../context/shared/domain/Result';
import { deleteFileFromStorageByFileId } from '../../../../infra/drive-server/services/files/services/delete-file-content-from-bucket';
import { retryWithBackoff } from '../../../../shared/retry-with-backoff';
import { createTransientErrorHandler } from '../../../../backend/common/rate-limit/transient-error-handler';
import configStore from '../../../../apps/main/config';
import { addMaxFileSizeRejection } from '../../user/file-size-limit/add-max-file-size-rejection';
import { validateUploadFileSize } from '../../user/file-size-limit/validate-upload-file-size';

export type UploadFileParams = {
  path: string;
  size: number;
  bucket: string;
  folderId: number;
  folderUuid: string;
  environment: Environment;
  signal: AbortSignal;
};

async function uploadFile(file: UploadFileParams): Promise<Result<File | null, DriveDesktopError>> {
  const validation = validateUploadFileSize({
    size: file.size,
    maxUploadFileSize: configStore.get('maxUploadFileSizeInBytes'),
  });

  if (!validation.allowed) {
    addMaxFileSizeRejection({ path: file.path, fileSize: file.size, validation, blockUploadPath: false });
    logger.warn({
      tag: 'BACKUPS',
      msg: 'Skipping backup file because it exceeds upload size limit',
      path: file.path,
      size: file.size,
      maxFileSize: validation.maxFileSize,
      reason: validation.reason,
      showUpgradeCta: validation.showUpgradeCta,
    });
    return { data: null };
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
    return { data: null };
  }

  const metadataResult = await retryWithBackoff(
    () =>
      createFileToBackend({
        contentsId,
        filePath: file.path,
        size: file.size,
        folderId: file.folderId,
        folderUuid: file.folderUuid,
        bucket: file.bucket,
      }),
    createTransientErrorHandler({ tag: 'BACKUPS', context: 'BACKUP UPLOAD RETRY', path: file.path }),
    file.signal,
  );

  if (metadataResult.error) {
    await deleteFileFromStorageByFileId({ bucketId: file.bucket, fileId: contentsId });

    if (metadataResult.error.cause === 'FILE_TOO_BIG') {
      addMaxFileSizeRejection({ path: file.path, fileSize: file.size, blockUploadPath: false });
      logger.warn({
        tag: 'BACKUPS',
        msg: 'Skipping backup file because backend rejected it by upload size limit',
        path: file.path,
        size: file.size,
      });
      return { data: null };
    }

    return { error: metadataResult.error };
  }

  return { data: metadataResult.data };
}

export async function uploadFileToBackup(file: UploadFileParams): Promise<Result<File | null, DriveDesktopError>> {
  const result = await uploadFile(file);

  if (result.error?.cause === 'FILE_ALREADY_EXISTS') {
    logger.debug({
      tag: 'BACKUPS',
      msg: `[FILE ALREADY EXISTS] Skipping file ${file.path} - already exists remotely`,
    });
    return { data: null };
  }

  return result;
}

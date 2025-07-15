import { createReadStream } from 'fs';
import { LocalFile } from '../domain/LocalFile';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { getUploadCallbacks } from '@/apps/backups/process-files/upload-callbacks';
import { logger } from '@/apps/shared/logger/logger';

type TProps = {
  context: BackupsContext;
  localFile: LocalFile;
  uploader: EnvironmentFileUploader;
};

export async function uploadFile({ context, localFile, uploader }: TProps) {
  const readable = createReadStream(localFile.absolutePath);
  const { data: contentsId, error } = await uploader.upload({
    path: localFile.absolutePath,
    size: localFile.size.value,
    abortSignal: context.abortController.signal,
    readable,
    callbacks: getUploadCallbacks({ path: localFile.absolutePath }),
  });

  if (error) {
    if (error.code !== 'KILLED_BY_USER') {
      logger.error({
        tag: 'BACKUPS',
        msg: 'Error uploading file',
        path: localFile.absolutePath,
        error,
      });

      if (error.code !== 'UNKNOWN') {
        context.addIssue({
          error: error.code,
          name: localFile.relativePath,
        });
      }
    }
  }

  return contentsId;
}

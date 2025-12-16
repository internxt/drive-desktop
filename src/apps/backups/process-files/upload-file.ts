import { LocalFile } from '@/context/local/localFile/domain/LocalFile';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { getUploadCallbacks } from '@/apps/backups/process-files/upload-callbacks';
import { logger } from '@/apps/shared/logger/logger';

type TProps = {
  context: BackupsContext;
  localFile: LocalFile;
};

export async function uploadFile({ context, localFile }: TProps) {
  const { data: contentsId, error } = await context.fileUploader.run({
    path: localFile.absolutePath,
    size: localFile.size,
    abortSignal: context.abortController.signal,
    callbacks: getUploadCallbacks({ path: localFile.absolutePath }),
  });

  if (error) {
    if (error.code !== 'ABORTED') {
      logger.error({
        tag: 'BACKUPS',
        msg: 'Error uploading file',
        path: localFile.absolutePath,
        error,
      });

      if (error.code !== 'UNKNOWN') {
        context.addIssue({
          error: error.code,
          name: localFile.absolutePath,
        });
      }
    }
  }

  return contentsId;
}

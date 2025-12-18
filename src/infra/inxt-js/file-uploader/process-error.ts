import { logger } from '@/apps/shared/logger/logger';
import { addGeneralIssue } from '@/apps/main/background-processes/issues';
import { LocalSync } from '@/backend/features';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

type TProps = {
  path: AbsolutePath;
  error: Error | null;
};

export function processError({ path, error }: TProps) {
  if (error) {
    if (error.message === 'Process killed by user') return;

    LocalSync.SyncState.addItem({ action: 'UPLOAD_ERROR', path });

    if (error.message === 'Max space used') {
      logger.error({
        msg: 'Failed to upload file to the bucket. Not enough space',
        path,
        error,
      });

      addGeneralIssue({ error: 'NOT_ENOUGH_SPACE', name: path });
    }

    logger.error({
      msg: 'Failed to upload file to the bucket',
      path,
      error,
    });
  }
}

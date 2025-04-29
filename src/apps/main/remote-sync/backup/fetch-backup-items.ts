import { logger } from '@/apps/shared/logger/logger';
import { fetchBackupFiles } from './fetch-backup-files';
import { fetchBackupFolders } from './fetch-backup-folders';

type TProps = {
  folderUuid: string;
};

export async function fetchBackupItems({ folderUuid }: TProps): Promise<void> {
  try {
    logger.debug({
      msg: 'Fetch backup items started',
      folderUuid,
    });

    const filesPromise = fetchBackupFiles({ folderUuid });
    const foldersPromise = fetchBackupFolders({ folderUuid });

    await Promise.all([filesPromise, foldersPromise]);

    logger.debug({
      msg: 'Fetch backup items finished',
      folderUuid,
    });
  } catch (error) {
    throw logger.error({
      msg: 'Fetch backup items failed',
      folderUuid,
      exc: error,
    });
  }
}

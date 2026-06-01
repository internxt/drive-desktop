import { logger } from '@internxt/drive-desktop-core/build/backend/core/logger/logger';
import configStore from '../../../apps/main/config';
import { getBackupFolderUuid } from '../../../infra/drive-server/services/folder/services/fetch-backup-folder-uuid';
import { Result } from '../../../context/shared/domain/Result';
import { BackupEntry } from './types/BackupEntry';

type Props = {
  pathname: string;
  backup: BackupEntry;
};

export async function migrateBackupEntryIfNeeded({ pathname, backup }: Props): Promise<Result<BackupEntry, Error>> {
  const { error, data: folderUuid } = await getBackupFolderUuid({ folderId: String(backup.folderId) });
  if (error) {
    logger.error({
      tag: 'BACKUPS',
      msg: `Failed to migrate backup entry for ${pathname}`,
      error,
    });
    return { error };
  }

  backup.folderUuid = folderUuid;

  const backupList = configStore.get('backupList');
  backupList[pathname] = backup;
  configStore.set('backupList', backupList);

  logger.debug({
    tag: 'BACKUPS',
    msg: `Successfully migrated backup entry for ${pathname} with UUID ${folderUuid}`,
  });

  return { data: backup };
}

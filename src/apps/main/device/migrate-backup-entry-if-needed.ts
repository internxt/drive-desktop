import { logger } from '@internxt/drive-desktop-core/build/backend/core/logger/logger';
import configStore from '../config';
import { getBackupFolderUuid } from '../../../infra/drive-server/services/backup/services/fetch-backup-folder-uuid';

export async function migrateBackupEntryIfNeeded(
  pathname: string,
  backup: {
    enabled: boolean;
    folderId: number;
    folderUuid: string;
  }
): Promise<{
  enabled: boolean;
  folderId: number;
  folderUuid: string;
}> {
  if (backup.folderUuid) return backup;

  try {
    const getFolderUuidResponse = await getBackupFolderUuid(backup);
    if (getFolderUuidResponse.error) {
      logger.error({
        tag: 'BACKUPS',
        msg: `Failed to migrate backup entry for ${pathname}`,
        error: getFolderUuidResponse.error,
      });
      throw getFolderUuidResponse.error;
    }
    const { data: folderUuid } = getFolderUuidResponse;
    backup.folderUuid = folderUuid;

    const backupList = configStore.get('backupList');
    backupList[pathname] = backup;
    configStore.set('backupList', backupList);
    logger.debug({
      tag: 'BACKUPS',
      msg: `Successfully migrated backup entry for ${pathname} with UUID ${folderUuid}`,
    });
    return backup;
  } catch (error) {
    logger.error({
      tag: 'BACKUPS',
      msg: `Error migrating backup entry for ${pathname}`,
      error,
    });
    throw error;
  }
}

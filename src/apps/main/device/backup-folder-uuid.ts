import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import configStore from '../config';
import { logger } from '@/apps/shared/logger/logger';

type TBackup = { enabled: boolean; folderId: number; folderUuid?: string };
type TBackupList = Record<string, TBackup>;

export class BackupFolderUuid {
  constructor(
    private readonly store = configStore,
    private readonly driveServerWip = driveServerWipModule,
  ) {}

  async getBackupFolderUuid({ backup }: { backup: TBackup }): Promise<string> {
    if (backup.folderUuid) return backup.folderUuid;
    const { data, error } = await this.driveServerWip.folders.getMetadata({ folderId: backup.folderId });
    if (error) throw error;
    return data.uuid;
  }

  async ensureBackupUuidExists({ backupsList }: { backupsList: TBackupList }): Promise<void> {
    const entries = Object.entries(backupsList);
    logger.debug({
      tag: 'BACKUPS',
      msg: `Ensuring backup UUIDs exist for ${entries.length} backups`,
    });
    const promises = entries.map(async ([pathname, backup]) => {
      if (!backup.folderUuid && backup.enabled) {
        backup.folderUuid = await this.getBackupFolderUuid({ backup });
        backupsList[pathname] = backup;
      }
    });

    await Promise.all(promises);
    logger.debug({ tag: 'BACKUPS', msg: 'Finished ensuring UUIDs' });
    this.store.set('backupList', backupsList);
  }
}

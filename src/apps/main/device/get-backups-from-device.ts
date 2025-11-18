import configStore from '../config';
import { Device, findBackupPathnameFromId } from './service';
import { getUser, setUser } from '../auth/service';
import { BackupFolderUuid } from './backup-folder-uuid';
import { BackupInfo } from '@/apps/backups/BackupInfo';
import { logger } from '@/apps/shared/logger/logger';
import { app } from 'electron';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

export async function getBackupsFromDevice(device: Device, isCurrent?: boolean): Promise<Array<BackupInfo>> {
  try {
    const { data: folder, error } = await driveServerWipModule.backup.fetchFolder({ folderUuid: device.uuid });

    if (error) {
      throw error;
    }

    logger.debug({ tag: 'BACKUPS', msg: 'Fetched folder', childrenCount: folder.children.length });

    if (isCurrent) {
      const backupsList = configStore.get('backupList');

      await new BackupFolderUuid().ensureBackupUuidExists({ backupsList });

      const user = getUser();

      if (user && !user?.backupsBucket) {
        user.backupsBucket = device.bucket;
        setUser(user);
      }

      const backups = folder.children
        .map((backup) => ({ ...backup, pathname: findBackupPathnameFromId(backup.id) }))
        .filter(({ pathname }) => pathname && backupsList[pathname].enabled)
        .map((backup) => ({
          ...backup,
          pathname: abs(backup.pathname as string),
          folderId: backup.id,
          folderUuid: backup.uuid,
          tmpPath: app.getPath('temp'),
          backupsBucket: device.bucket,
        }));

      logger.debug({ tag: 'BACKUPS', msg: `Found enabled backups`, length: backups.length });

      return backups;
    }

    return folder.children.map((backup) => ({
      ...backup,
      folderId: backup.id,
      folderUuid: backup.uuid,
      backupsBucket: device.bucket,
      tmpPath: '',
      pathname: '' as AbsolutePath,
    }));
  } catch (error) {
    throw logger.error({ tag: 'BACKUPS', msg: 'Error getting backups', error });
  }
}

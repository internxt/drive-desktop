import configStore from '../config';
import { Device, fetchFolder, findBackupPathnameFromId } from './service';
import { getUser, setUser } from '../auth/service';
import { BackupFolderUuid } from './backup-folder-uuid';
import { BackupInfo } from '@/apps/backups/BackupInfo';
import { logger } from '@/apps/shared/logger/logger';
import { app } from 'electron';

export async function getBackupsFromDevice(device: Device, isCurrent?: boolean): Promise<Array<BackupInfo>> {
  try {
    logger.debug({ tag: 'BACKUPS', msg: 'Fetching folder for device', deviceUuid: device.uuid, isCurrent });
    const folder = await fetchFolder({ folderUuid: device.uuid });
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
          pathname: backup.pathname as string,
          folderId: backup.id,
          folderUuid: backup.uuid,
          tmpPath: app.getPath('temp'),
          backupsBucket: device.bucket,
        }));

      logger.debug({ tag: 'BACKUPS', msg: `Found ${backups.length} enabled backups` });

      return backups;
    } else {
      return folder.children.map((backup) => ({
        ...backup,
        folderId: backup.id,
        folderUuid: backup.uuid,
        backupsBucket: device.bucket,
        tmpPath: '',
        pathname: '',
      }));
    }
  } catch (error) {
    logger.error({ tag: 'BACKUPS', msg: 'Error getting backups', error });
    throw error;
  }
}

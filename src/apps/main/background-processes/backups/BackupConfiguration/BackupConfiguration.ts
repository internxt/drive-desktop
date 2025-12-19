import { app, ipcMain } from 'electron';
import configStore from '../../../config';
import { BackupInfo } from '../../../../backups/BackupInfo';
import { getOrCreateDevice } from '../../../device/service';
import { getBackupsFromDevice } from '@/apps/main/device/get-backups-from-device';
import { status } from '../BackupsProcessStatus/BackupsProcessStatus';

class BackupConfiguration {
  async obtainBackupsInfo(): Promise<Array<BackupInfo>> {
    const { data: device } = await getOrCreateDevice();

    if (!device) return [];

    const enabledBackupEntries = await getBackupsFromDevice(device, true);

    const backups: BackupInfo[] = enabledBackupEntries.map((backup) => ({
      folderUuid: backup.folderUuid,
      pathname: backup.pathname,
      folderId: backup.folderId,
      tmpPath: app.getPath('temp'),
      backupsBucket: device.bucket,
      plainName: backup.plainName,
    }));

    return backups;
  }
}

export const backupsConfig = new BackupConfiguration();

export function setupBackupConfig() {
  ipcMain.handle('get-backups-interval', () => {
    return configStore.get('backupInterval');
  });

  ipcMain.handle('get-last-backup-timestamp', () => {
    return configStore.get('lastBackup');
  });

  ipcMain.handle('get-backups-status', () => {
    return status.current();
  });
}

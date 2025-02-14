import { app, ipcMain } from 'electron';
import configStore from '../../../config';
import { BackupInfo } from '../../../../backups/BackupInfo';
import { getOrCreateDevice, getBackupsFromDevice } from '../../../device/service';
import Logger from 'electron-log';

type OnIntervalChangedListener = (interval: number) => void;

class BackupConfiguration {
  public onBackupIntervalChanged: OnIntervalChangedListener | undefined = undefined;

  get backupInterval(): number {
    return configStore.get('backupInterval');
  }

  set backupInterval(interval: number) {
    configStore.set('backupInterval', interval);

    if (this.onBackupIntervalChanged !== undefined) {
      this.onBackupIntervalChanged(interval);
    }
  }

  get lastBackup(): number {
    return configStore.get('lastBackup');
  }

  backupFinished() {
    configStore.set('lastBackup', Date.now());
  }

  get enabled(): boolean {
    return configStore.get('backupsEnabled');
  }

  set enabled(value: boolean) {
    configStore.set('backupsEnabled', value);
  }

  toggleEnabled() {
    const enabled = !this.enabled;
    this.enabled = enabled;
  }

  async obtainBackupsInfo(): Promise<Array<BackupInfo>> {
    const device = await getOrCreateDevice();

    const enabledBackupEntries = await getBackupsFromDevice(device, true);

    const backups: BackupInfo[] = enabledBackupEntries.map((backup) => ({
      folderUuid: backup.folderUuid,
      pathname: backup.pathname,
      folderId: backup.folderId,
      tmpPath: app.getPath('temp'),
      backupsBucket: device.bucket,
      name: backup.name,
    }));

    return backups;
  }

  hasDiscoveredBackups(): boolean {
    const discoveredBackup = configStore.get('discoveredBackup') as number;

    Logger.debug('Discovered backup', discoveredBackup);
    return discoveredBackup > 0;
  }

  backupsDiscovered(): void {
    configStore.set('discoveredBackup', Date.now());
  }
}

export const backupsConfig = new BackupConfiguration();

export function setupBackupConfig(): BackupConfiguration {
  ipcMain.handle('get-backups-interval', () => {
    Logger.debug('Getting backup interval', backupsConfig.backupInterval);
    return backupsConfig.backupInterval;
  });

  ipcMain.handle('set-backups-interval', (_, interval: number) => {
    backupsConfig.backupInterval = interval;
  });

  ipcMain.handle('get-last-backup-timestamp', () => {
    return backupsConfig.lastBackup;
  });

  ipcMain.handle('get-backups-enabled', () => {
    return backupsConfig.enabled;
  });

  ipcMain.handle('toggle-backups-enabled', () => {
    backupsConfig.toggleEnabled();
  });

  ipcMain.handle('user.get-has-discovered-backups', () => {
    return backupsConfig.hasDiscoveredBackups();
  });

  ipcMain.on('user.set-has-discovered-backups', () => {
    return backupsConfig.backupsDiscovered();
  });

  return backupsConfig;
}

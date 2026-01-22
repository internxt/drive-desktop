import { DeviceModule } from './../../../../../backend/features/device/device.module';
import { app } from 'electron';
import configStore from '../../../config';
import { BackupInfo } from '../../../../backups/BackupInfo';

export class BackupConfiguration {
  get backupInterval(): number {
    return configStore.get('backupInterval');
  }

  set backupInterval(interval: number) {
    configStore.set('backupInterval', interval);
  }

  get lastBackup(): number {
    return configStore.get('lastBackup');
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
    const device = await DeviceModule.getOrCreateDevice();
    if (device instanceof Error) return [];

    const enabledBackupEntries = await DeviceModule.getBackupsFromDevice(device, true);

    return this.map(enabledBackupEntries, device.bucket);
  }

  hasDiscoveredBackups(): boolean {
    const discoveredBackup = configStore.get('discoveredBackup');

    return discoveredBackup > 0;
  }

  backupsDiscovered(): void {
    configStore.set('discoveredBackup', Date.now());
  }

  map(backups: Array<BackupInfo>, deviceBucket: string): Array<BackupInfo> {
    return backups.map((backup) => ({
      folderUuid: backup.folderUuid,
      pathname: backup.pathname,
      folderId: backup.folderId,
      tmpPath: app.getPath('temp'),
      backupsBucket: deviceBucket,
      name: backup.name,
    }));
  }
}

import { ipcMain } from 'electron';
import configStore from '../../../config';
import { getOrCreateDevice } from '../../../device/service';
import { getBackupsFromDevice } from '@/apps/main/device/get-backups-from-device';
import { tracker } from '../BackupsProcessTracker/BackupsProcessTracker';

export async function obtainBackupsInfo() {
  const { data: device } = await getOrCreateDevice();

  if (!device) return [];

  return await getBackupsFromDevice(device, true);
}

export function setupBackupConfig() {
  ipcMain.handle('get-backups-interval', () => {
    return configStore.get('backupInterval');
  });

  ipcMain.handle('get-last-backup-timestamp', () => {
    return configStore.get('lastBackup');
  });

  ipcMain.handle('get-backups-status', () => {
    return tracker.status;
  });
}

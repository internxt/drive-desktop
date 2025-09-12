import { ipcMain } from 'electron';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import {
  addBackup,
  changeBackupPath,
  createBackupsFromLocalPaths,
  deleteBackup,
  deleteBackupsFromDevice,
  disableBackup,
  downloadBackup,
  getDevices,
  getPathFromDialog,
} from './service';
import { DeviceModule } from '../../../backend/features/device/device.module';

ipcMain.handle('devices.get-all', () => getDevices());

ipcMain.handle('get-or-create-device', DeviceModule.getOrCreateDevice);

ipcMain.handle('rename-device', (_, v) => DeviceModule.renameDevice(v));

ipcMain.handle('get-backups-from-device', (_, d, c?) =>
  DeviceModule.getBackupsFromDevice(d, c)
);

ipcMain.handle('add-backup', () =>
  addBackup().catch((err) => {
    logger.error({ tag: 'BACKUPS', msg: 'Error adding backup:', error: err });
  })
);
ipcMain.handle('add-multiple-backups', (_, folderPaths) =>
  createBackupsFromLocalPaths(folderPaths)
);

ipcMain.handle('download-backup', (_, v) => downloadBackup(v));

ipcMain.handle('delete-backup', (_, v, c?) => deleteBackup(v, c));

ipcMain.handle('delete-backups-from-device', (_, v, c?) =>
  deleteBackupsFromDevice(v, c)
);

ipcMain.handle('disable-backup', (_, v) => disableBackup(v));

ipcMain.handle('change-backup-path', (_, v) => changeBackupPath(v));

ipcMain.on('add-device-issue', (_, e) => DeviceModule.addUnknownDeviceIssue(e));

ipcMain.handle('get-folder-path', () => getPathFromDialog());

import { ipcMain } from 'electron';

import {
  addBackup,
  changeBackupPath,
  deleteBackup,
  disableBackup,
  deleteBackupsFromDevice,
  getBackupsFromDevice,
  getPathFromDialog,
  createBackupsFromLocalPaths,
  downloadBackup,
} from './service';
import { DeviceModule } from '@/backend/features/backups/device/device.module';

ipcMain.handle('get-or-create-device', DeviceModule.getOrCreateDevice);

ipcMain.handle('rename-device', (_, v) => DeviceModule.renameDevice(v));

ipcMain.handle('devices.get-all', () => DeviceModule.getDevices());

ipcMain.handle('get-backups-from-device', (_, d, c?) => getBackupsFromDevice(d, c));

ipcMain.handle('add-backup', addBackup);

ipcMain.handle('add-multiple-backups', (_, folderPaths) => createBackupsFromLocalPaths(folderPaths));

ipcMain.handle('delete-backup', (_, v) => deleteBackup(v));

ipcMain.handle('delete-backups-from-device', (_, v, c?) => deleteBackupsFromDevice(v, c));

ipcMain.handle('disable-backup', (_, v) => disableBackup(v));

ipcMain.handle('download-backup', (_, v, fd) => downloadBackup(v, fd));

ipcMain.handle('change-backup-path', (_, v) => changeBackupPath(v));

ipcMain.on('add-device-issue', (_, e) => DeviceModule.addUnknownDeviceIssue(e));

ipcMain.handle('get-folder-path', () => getPathFromDialog());

import { ipcMain } from 'electron';

import {
  addBackup,
  addUnknownDeviceIssue,
  changeBackupPath,
  deleteBackup,
  disableBackup,
  deleteBackupsFromDevice,
  getBackupsFromDevice,
  getPathFromDialog,
  getOrCreateDevice,
  getDevices,
  renameDevice,
  createBackupsFromLocalPaths,
  downloadBackup,
} from './service';
ipcMain.handle('get-or-create-device', getOrCreateDevice);

ipcMain.handle('rename-device', (_, v) => renameDevice(v));

ipcMain.handle('devices.get-all', () => getDevices());

ipcMain.handle('get-backups-from-device', (_, d, c?) =>
  getBackupsFromDevice(d, c)
);

ipcMain.handle('add-backup', addBackup);
ipcMain.handle('add-multiple-backups', (_, folderPaths) =>
  createBackupsFromLocalPaths(folderPaths)
);

ipcMain.handle('delete-backup', (_, v) => deleteBackup(v));

ipcMain.handle('delete-backups-from-device', (_, v, c?) =>
  deleteBackupsFromDevice(v, c)
);

ipcMain.handle('disable-backup', (_, v) => disableBackup(v));

ipcMain.handle('download-backup', (_, v) => downloadBackup(v));

ipcMain.handle('change-backup-path', (_, v) => changeBackupPath(v));

ipcMain.on('add-device-issue', (_, e) => addUnknownDeviceIssue(e));

ipcMain.handle('get-folder-path', () => getPathFromDialog());

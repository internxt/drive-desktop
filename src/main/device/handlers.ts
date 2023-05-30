import { ipcMain } from 'electron';

import {
  addBackup,
  addUnknownDeviceIssue,
  changeBackupPath,
  deleteBackup,
  disableBackup,
  getBackupsFromDevice,
  getOrCreateDevice,
  renameDevice,
} from './service';

ipcMain.handle('get-or-create-device', getOrCreateDevice);

ipcMain.handle('rename-device', (_, v) => renameDevice(v));

ipcMain.handle('get-backups', getBackupsFromDevice);

ipcMain.handle('add-backup', addBackup);

ipcMain.handle('delete-backup', (_, v) => deleteBackup(v));

ipcMain.handle('disable-backup', (_, v) => disableBackup(v));

ipcMain.handle('change-backup-path', (_, v) => changeBackupPath(v));

ipcMain.on('add-device-issue', (_, e) => addUnknownDeviceIssue(e));

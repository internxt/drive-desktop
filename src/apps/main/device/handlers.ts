import { ipcMain } from 'electron';
import { logAndTrackError } from '../../drive/trackError';
import {
  addBackup,
  addUnknownDeviceIssue,
  changeBackupPath,
  createBackupsFromLocalPaths,
  deleteBackup,
  disableBackup,
  getBackupsFromDevice,
  getDevices,
  getOrCreateDevice,
  getPathFromDialog,
  renameDevice,
} from './service';

ipcMain.handle('devices.get-all', () => getDevices());

ipcMain.handle('get-or-create-device', getOrCreateDevice);

ipcMain.handle('rename-device', (_, v) => renameDevice(v));

ipcMain.handle('get-backups', getBackupsFromDevice);

ipcMain.handle('add-backup', () =>
  addBackup().catch((err) => {
    logAndTrackError(err);
  })
);
ipcMain.handle('add-multiple-backups', (_, folderPaths) =>
  createBackupsFromLocalPaths(folderPaths)
);

ipcMain.handle('delete-backup', (_, v) => deleteBackup(v));

ipcMain.handle('disable-backup', (_, v) => disableBackup(v));

ipcMain.handle('change-backup-path', (_, v) => changeBackupPath(v));

ipcMain.on('add-device-issue', (_, e) => addUnknownDeviceIssue(e));

ipcMain.handle('get-folder-path', () => getPathFromDialog());

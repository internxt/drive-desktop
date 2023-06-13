import { ipcMain, shell } from 'electron';

import {
  addBackup,
  addUnknownDeviceIssue,
  changeBackupPath,
  deleteBackup,
  disableBackup,
  getBackupsFromDevice,
  getPathFromDialog,
  getOrCreateDevice,
  renameDevice,
  createBackupsFromLocalPaths,
} from './service';
import { getVirtualDrivePath } from '../../workers/webdav/VirtualDrive';
ipcMain.handle('get-or-create-device', getOrCreateDevice);

ipcMain.handle('rename-device', (_, v) => renameDevice(v));

ipcMain.handle('get-backups', getBackupsFromDevice);

ipcMain.handle('add-backup', addBackup);
ipcMain.handle('add-multiple-backups', (_, folderPaths) =>
  createBackupsFromLocalPaths(folderPaths)
);

ipcMain.handle('delete-backup', (_, v) => deleteBackup(v));

ipcMain.handle('disable-backup', (_, v) => disableBackup(v));

ipcMain.handle('change-backup-path', (_, v) => changeBackupPath(v));

ipcMain.on('add-device-issue', (_, e) => addUnknownDeviceIssue(e));

ipcMain.handle('get-folder-path', () => getPathFromDialog());
ipcMain.handle('open-virtual-drive', () => {
  return shell.openPath(getVirtualDrivePath());
});

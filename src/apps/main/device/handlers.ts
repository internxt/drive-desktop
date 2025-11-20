import { ipcMain } from 'electron';

import {
  addBackup,
  deleteBackup,
  disableBackup,
  deleteBackupsFromDevice,
  getPathFromDialog,
  getOrCreateDevice,
  getDevices,
  renameDevice,
} from './service';
import { getBackupsFromDevice } from './get-backups-from-device';

ipcMain.handle('get-or-create-device', getOrCreateDevice);

ipcMain.handle('rename-device', (_, v) => renameDevice(v));

ipcMain.handle('devices.get-all', () => getDevices());

ipcMain.handle('get-backups-from-device', (_, d, c?) => getBackupsFromDevice(d, c));

ipcMain.handle('add-backup', addBackup);

ipcMain.handle('delete-backup', (_, v) => deleteBackup(v));

ipcMain.handle('delete-backups-from-device', (_, v, c?) => deleteBackupsFromDevice(v, c));

ipcMain.handle('disable-backup', (_, v) => disableBackup(v));

ipcMain.handle('get-folder-path', () => getPathFromDialog());

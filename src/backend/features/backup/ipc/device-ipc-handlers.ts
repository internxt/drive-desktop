import { ipcMain } from 'electron';
import { DeviceModule } from '../../device/device.module';
import { addBackup } from '../add-backup';
import { getPathFromDialog } from '../../../../core/utils/get-path-from-dialog';
import { getActiveBackupDevices } from '../../device/get-active-backup-devices';
import { createBackupsFromLocalPaths } from '../create-backups-from-local-paths';
import { deleteBackup } from '../delete-backup';
import { deleteDeviceBackups } from '../delete-device-backups';
import { disableBackup } from '../disable-backup';
import { changeBackupPath } from '../change-backup-path';
import { downloadBackup } from '../download-backup';

ipcMain.handle('devices.get-all', () => getActiveBackupDevices());

ipcMain.handle('get-or-create-device', DeviceModule.getOrCreateDevice);

ipcMain.handle('rename-device', (_, v) => DeviceModule.renameDevice(v));

ipcMain.handle('get-backups-from-device', (_, d, c?) => DeviceModule.getBackupsFromDevice(d, c));

ipcMain.handle('add-backup', () => addBackup());

ipcMain.handle('add-multiple-backups', (_, folderPaths) => createBackupsFromLocalPaths({ folderPaths }));

ipcMain.handle('download-backup', (_, device, pathname) => downloadBackup({ device, pathname }));

ipcMain.handle('delete-backup', (_, v, c?) => deleteBackup({ backup: v, isCurrent: c }));

ipcMain.handle('delete-backups-from-device', (_, v, c?) => deleteDeviceBackups({ device: v, isCurrent: c }));

ipcMain.handle('disable-backup', (_, v) => disableBackup({ backup: v }));

ipcMain.handle('change-backup-path', (_, { currentPath, newPath }) => changeBackupPath({ currentPath, newPath }));

ipcMain.on('add-device-issue', (_, e) => DeviceModule.addUnknownDeviceIssue(e));

ipcMain.handle('get-folder-path', () => getPathFromDialog());

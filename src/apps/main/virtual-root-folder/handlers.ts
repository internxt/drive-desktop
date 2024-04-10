import { ipcMain } from 'electron';

import {
  chooseSyncRootWithDialog,
  getRootVirtualDrive,
  openVirtualDriveRootFolder,
} from './service';

ipcMain.handle('get-virtual-drive-root', getRootVirtualDrive);

ipcMain.handle('choose-sync-root-with-dialog', chooseSyncRootWithDialog);

ipcMain.handle('open-virtual-drive-folder', openVirtualDriveRootFolder);

//ipcMain.handle('retry-virtual-drive-mount', () => chooseSyncRootWithDialog);

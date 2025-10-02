import { ipcMain } from 'electron';

import { chooseSyncRootWithDialog, getRootVirtualDrive, openVirtualDriveRootFolder } from './service';

export function setupVirtualDriveHandlers() {
  ipcMain.handle('choose-sync-root-with-dialog', chooseSyncRootWithDialog);
  ipcMain.handle('open-virtual-drive-folder', openVirtualDriveRootFolder);
  ipcMain.handle('get-sync-root', async () => getRootVirtualDrive());
  ipcMain.handle('retry-virtual-drive-mount', chooseSyncRootWithDialog);
}

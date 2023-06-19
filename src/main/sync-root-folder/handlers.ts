import { ipcMain, shell } from 'electron';
import { getVirtualDrivePath } from '../../workers/webdav/VirtualDrive';

import configStore from '../config';
import { chooseSyncRootWithDialog } from './service';

ipcMain.handle('get-sync-root', () => {
  return configStore.get('syncRoot');
});

ipcMain.handle('choose-sync-root-with-dialog', chooseSyncRootWithDialog);

ipcMain.handle('open-sync-folder', async () => {
  const syncFolderPath = getVirtualDrivePath();

  const errorMessage = await shell.openPath(syncFolderPath);

  if (errorMessage) throw new Error(errorMessage);
});

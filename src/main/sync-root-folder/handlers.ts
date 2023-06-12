import { ipcMain, shell } from 'electron';
import { getVirtualDrivePath } from '../../workers/webdav/VirtualDrive';

import configStore from '../config';
import { chooseSyncRootWithDialog } from './service';

ipcMain.handle('get-sync-root', () => {
  return configStore.get('syncRoot');
});

ipcMain.handle('choose-sync-root-with-dialog', chooseSyncRootWithDialog);

ipcMain.handle('open-sync-folder', () => {
  const syncFolderPath = getVirtualDrivePath();

  return shell.openPath(syncFolderPath);
});

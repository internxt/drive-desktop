import { app, ipcMain, shell } from 'electron';

import configStore from '../config';
import { chooseSyncRootWithDialog } from './service';
import { getVirtualDrivePath } from '../../workers/webdav/VirtualDrive';

ipcMain.handle('get-sync-root', () => {
  return configStore.get('syncRoot');
});

ipcMain.handle('choose-sync-root-with-dialog', chooseSyncRootWithDialog);

ipcMain.handle('open-sync-folder', () => {
  const syncFolderPath = getVirtualDrivePath();

  const finalPath = syncFolderPath.replace('~', app.getPath('home'));
  return shell.openPath(finalPath);
});

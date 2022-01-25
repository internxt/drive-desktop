import { ipcMain } from 'electron';
import configStore from '../config';
import { chooseSyncRootWithDialog } from './service';

ipcMain.handle('get-sync-root', () => {
  return configStore.get('syncRoot');
});

ipcMain.handle('set-sync-root', chooseSyncRootWithDialog);

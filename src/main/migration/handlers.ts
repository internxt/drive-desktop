import { ipcMain } from 'electron';
import { moveSyncFolderToDesktop } from './service';

ipcMain.handle('move-sync-folder-to-desktop', () => {
  return moveSyncFolderToDesktop();
});

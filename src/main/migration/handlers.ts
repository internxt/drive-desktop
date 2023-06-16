import { ipcMain } from 'electron';
import { moveSyncFolderToDesktop, openMigrationFailedFolder } from './service';

ipcMain.handle('move-sync-folder-to-desktop', () => {
  return moveSyncFolderToDesktop();
});

ipcMain.handle('open-migration-failed-folder', () => {
  return openMigrationFailedFolder();
});

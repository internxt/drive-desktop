import { app, ipcMain } from 'electron';
import path from 'path';
import { ensureLocalFolderExists } from '../application/ensureLocalFolderExists';

const appData = app.getPath('appData');

export const DOWNLOADED_THUMBNAILS_FOLDER = path.join(
  appData,
  'internxt-drive',
  'thumbnails'
);

ipcMain.handle('GET_LOCAL_THUMBNAIL_FOLDER', async () => {
  await ensureLocalFolderExists(DOWNLOADED_THUMBNAILS_FOLDER);

  return DOWNLOADED_THUMBNAILS_FOLDER;
});

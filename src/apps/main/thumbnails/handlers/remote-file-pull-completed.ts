import { ipcMain } from 'electron';

import { createAndUploadThumbnail } from '../application/create-and-upload-thumbnail';

ipcMain.handle(
  'REMOTE_FILE_PULL_COMPLETED',
  async (_, fileName: string, fileCreated: number) =>
    createAndUploadThumbnail(fileCreated, fileName)
);

import { ipcMain } from 'electron';

import { createAndUploadThumbnail } from '../application/create-and-upload-thumbnail';

ipcMain.handle(
  'REMOTE_FILE_PULL_COMPLETED',
  async (_, fileName: string, fileId: number, path: string) =>
    await createAndUploadThumbnail(fileId, fileName, path)
);

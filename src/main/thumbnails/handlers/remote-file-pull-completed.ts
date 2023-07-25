import { ipcMain } from 'electron';
import { WebdavFileInsertedPayload } from '../../../shared/IPC/events/file/WebdavFileCreatedPayload';
import { ipcWebdav } from '../../ipcs/webdav';

import { createAndUploadThumbnail } from '../application/create-and-upload-thumbnail';

ipcMain.handle(
  'REMOTE_FILE_PULL_COMPLETED',
  async (_, fileName: string, fileCreated: number) =>
    createAndUploadThumbnail(fileCreated, fileName)
);

ipcWebdav.on('FILE_INSERTED', async (_, payload: WebdavFileInsertedPayload) =>
  createAndUploadThumbnail(payload.id, payload.name)
);

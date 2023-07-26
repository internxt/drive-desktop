import { ipcMain } from 'electron';
import { WebdavFileInsertedPayload } from '../../../shared/IPC/events/file/WebdavFileCreatedPayload';

import { createAndUploadThumbnail } from '../application/create-and-upload-thumbnail';

import { ipcWebdav } from '../../ipcs/webdav';

ipcMain.handle(
  'REMOTE_FILE_PULL_COMPLETED',
  async (_, fileName: string, fileCreated: number) =>
    createAndUploadThumbnail(fileCreated, fileName)
);

ipcWebdav.on('FILE_INSERTED', (_, payload: WebdavFileInsertedPayload) => {
  createAndUploadThumbnail(payload.id, `${payload.name}.${payload.extension}`);
});

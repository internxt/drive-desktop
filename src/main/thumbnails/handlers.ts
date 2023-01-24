import { ipcMain } from 'electron';
import Logger from 'electron-log';
import { FileCreatedResponseDTO } from '../../shared/HttpClient/responses/file-created';
import { createThumbnail } from './service';

ipcMain.on(
  'REMOTE_FILE_PULL_COMPLETED',
  async (_, fileName: string, fileCreated: FileCreatedResponseDTO) => {
    Logger.debug('REMOTE_FILE_PULL_COMPLETED LISTENED');
    Logger.debug(
      `FILE NAME: ${fileName} | FILE CREATED: ${JSON.stringify(fileCreated)}`
    );
    createThumbnail(fileCreated.id, fileName);
  }
);

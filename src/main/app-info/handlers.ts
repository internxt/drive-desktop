import { ipcMain, app } from 'electron';

import { executeQuery } from './service';

import Logger from 'electron-log';

ipcMain.handle('execute-app-query', (_, query) => executeQuery(query));

ipcMain.handle('get-path', (_, path) => {
  Logger.debug(path);

  const result = app.getPath(path);
  return result;
});

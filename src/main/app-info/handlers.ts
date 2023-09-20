import { ipcMain, app } from 'electron';

import { executeQuery } from './service';

ipcMain.handle('execute-app-query', (_, query) => executeQuery(query));

ipcMain.handle('get-path', (_, path) => {
  const result = app.getPath(path);
  return result;
});

ipcMain.handle('APP:TEMPORAL_FILES_FOLDER', () => {
  return app.getPath('temp');
});

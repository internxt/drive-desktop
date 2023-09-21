import { ipcMain, app } from 'electron';

import { executeQuery } from './service';
import axios from 'axios';

ipcMain.handle('execute-app-query', (_, query) => executeQuery(query));

ipcMain.handle('get-download-urls', async () => {
  const response = await axios.get('https://internxt.com/api/download');

  return response.data;
});

ipcMain.handle('get-path', (_, path) => {
  const result = app.getPath(path);
  return result;
});

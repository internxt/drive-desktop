import { ipcMain } from 'electron';
import { getUser, getHeaders } from './service';

ipcMain.handle('get-user', () => {
  return getUser();
});

ipcMain.handle('get-headers', () => {
  return getHeaders();
});

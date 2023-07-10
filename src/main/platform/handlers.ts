import { ipcMain, shell } from 'electron';

ipcMain.handle('get-platform', () => {
  return process.platform;
});

ipcMain.handle('open-url', (_, url: string) => {
  return shell.openExternal(url);
});

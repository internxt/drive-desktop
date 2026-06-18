import { ipcMain, shell } from 'electron';

ipcMain.handle('open-url', (_, url: string) => {
  return shell.openExternal(url);
});

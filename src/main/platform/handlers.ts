import { ipcMain, shell } from 'electron';
import { exec } from 'child_process';

ipcMain.handle('get-platform', () => {
  return process.platform;
});

ipcMain.handle('open-url', (_, url: string) => {

  if (process.platform === 'linux') {
    return exec(`xdg-open ${url} &`);
  }


  return shell.openExternal(url);
});

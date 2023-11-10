import { ipcMain, shell } from 'electron';
import { exec } from 'child_process';

ipcMain.handle('get-platform', () => {
  return process.platform;
});

ipcMain.handle('open-url', (_, url: string) => {

  if (process.platform === 'linux') {
    // shell.openExternal is not working as intended on the current verions of electron
    // this is only a workaround to fix it
    return new Promise<void>((resolve, reject) => {
      exec(`xdg-open ${url} &`, (error) => {
        if (error) reject(error);

        resolve();
      });
    });
    
  }


  return shell.openExternal(url);
});

import { ipcMain } from 'electron';
import { exec } from 'child_process';

ipcMain.handle('open-url', (_, url: string) => {
  return new Promise<void>((resolve, reject) => {
    exec(`xdg-open ${url} &`, (error) => {
      if (error) reject(error);

      resolve();
    });
  });
});

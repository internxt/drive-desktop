import dns from 'node:dns';
import { ipcMain } from 'electron';
import { getPendingUpdateInfo } from './bootstrap-runtime-state';

export function registerMainIpcHandlers() {
  ipcMain.handle('get-update-status', () => getPendingUpdateInfo());

  ipcMain.handle('check-internet-connection', async () => {
    return new Promise((resolve) => {
      dns.lookup('google.com', (err) => {
        resolve(!err);
      });

      setTimeout(() => resolve(false), 3000);
    });
  });
}

import { app, ipcMain } from 'electron';
import { stopVirtualDrive } from './background-processes/webdav';

export async function quitApp() {
  await stopVirtualDrive();

  app.quit();
}

ipcMain.on('user-quit', async () => {
  await quitApp();
});

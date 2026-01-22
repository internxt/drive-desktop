import { app, ipcMain } from 'electron';

ipcMain.on('user-quit', async () => {
  app.quit();
});

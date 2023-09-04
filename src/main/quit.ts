import { app, ipcMain } from 'electron';

let cleanUpFunction: () => Promise<void>;

export function setCleanUpFunction(fn: () => Promise<void>) {
  cleanUpFunction = fn;
}

export async function quitApp() {
  // await stopVirtualDrive();

  if (cleanUpFunction) {
    await Promise.allSettled([cleanUpFunction()]);
  }

  app.quit();
}

ipcMain.on('user-quit', async () => {
  await quitApp();
});

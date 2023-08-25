import { app, ipcMain } from 'electron';
// import { stopVirtualDrive } from './background-processes/webdav';

let cleanUpFunction: () => Promise<void>;

export function setCleanUpFunction(fn: () => Promise<void>) {
  cleanUpFunction = fn;
}

export async function quitApp() {
  // await stopVirtualDrive();

  if (cleanUpFunction) {
    await cleanUpFunction();
  }

  app.quit();
}

ipcMain.on('user-quit', async () => {
  await quitApp();
});

import { app, ipcMain } from 'electron';
import Logger from 'electron-log';
import path from 'path';
import { FuseApp } from '../fuse/FuseApp';
import { HydrationApi } from '../hydration-api/HydrationApi';
import eventBus from '../main/event-bus';
import { getRootVirtualDrive } from '../main/virtual-root-folder/service';
import { DriveDependencyContainerFactory } from './dependency-injection/DriveDependencyContainerFactory';

let fuseApp: FuseApp;

async function startFuseApp() {
  const root = getRootVirtualDrive();

  Logger.debug('ROOT FOLDER: ', root);

  const appData = app.getPath('appData');
  const local = path.join(appData, 'internxt-drive', 'downloaded');

  const container = await DriveDependencyContainerFactory.build();

  const hydrationApi = new HydrationApi(container);

  fuseApp = new FuseApp(container, {
    root,
    local,
  });

  await hydrationApi.start({ debug: true });

  await fuseApp.start();
}

export async function stopSyncEngineWatcher() {
  await fuseApp.stop();
}

async function stopAndClearFuseApp() {
  await fuseApp.clearCache();
  await fuseApp.stop();
}

async function updateFuseApp() {
  await fuseApp.update();
}

eventBus.on('USER_LOGGED_OUT', stopAndClearFuseApp);
eventBus.on('USER_WAS_UNAUTHORIZED', stopAndClearFuseApp);
eventBus.on('INITIAL_SYNC_READY', startFuseApp);
eventBus.on('REMOTE_CHANGES_SYNCHED', updateFuseApp);

ipcMain.handle('get-virtual-drive-status', () => {
  if (!fuseApp) {
    return 'MOUNTED';
  }
  return fuseApp.getStatus();
});

ipcMain.handle('retry-virtual-drive-mount', async () => {
  Logger.info('Going to retry mount the app');
  fuseApp.stop();
  await startFuseApp();
});

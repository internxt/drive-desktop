import { ipcMain } from 'electron';
import Logger from 'electron-log';
import eventBus from '../main/event-bus';
import { getRootVirtualDrive } from '../main/virtual-root-folder/service';
import { VirtualDrive } from './VirtualDrive';
import { DriveDependencyContainerFactory } from './dependency-injection/DriveDependencyContainerFactory';
import { FuseApp } from './fuse/FuseApp';
import { HydrationApi } from './hydration-api/HydrationApi';

let fuseApp: FuseApp;

async function startFuseApp() {
  const root = getRootVirtualDrive();

  const container = await DriveDependencyContainerFactory.build();

  const virtualDrive = new VirtualDrive(container);

  const hydrationApi = new HydrationApi(virtualDrive, container);

  fuseApp = new FuseApp(virtualDrive, container, root);

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

import Logger from 'electron-log';

import { app } from 'electron';
import eventBus from '../main/event-bus';
import { FuseApp } from './FuseApp';
import path from 'path';
import { FuseDependencyContainerFactory } from './dependency-injection/FuseDependencyContainerFactory';
import { HydrationApi } from '../hydration-api/HydrationApi';
import { getRootVirtualDrive } from '../main/virtual-root-folder/service';

let fuseApp: FuseApp;

async function startFuseApp() {
  const api = new HydrationApi();

  await api.start({
    debug: false,
  });

  const root = getRootVirtualDrive();

  Logger.debug('ROOT FOLDER: ', root);

  const appData = app.getPath('appData');
  const local = path.join(appData, 'internxt-drive', 'downloaded');

  const containerFactory = new FuseDependencyContainerFactory();
  const container = await containerFactory.build();

  fuseApp = new FuseApp(container, {
    root,
    local,
  });

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

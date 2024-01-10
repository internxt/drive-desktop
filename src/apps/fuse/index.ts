import Logger from 'electron-log';

import { app } from 'electron';
import { getRootVirtualDrive } from '../main/virutal-root-folder/service';
import eventBus from '../main/event-bus';
import { FuseApp } from './FuseApp';
import path from 'path';
import { HydrationApi } from '../hydratation-api/HidratationApi';
import { FuseDependencyContainerFactory } from './dependency-injection/FuseDependencyContainerFactory';

let fuseApp: FuseApp;

async function spawnSyncEngineWorker() {
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

async function stopAndClearSyncEngineWatcher() {
  await fuseApp.clearCache();
  await fuseApp.stop();
}

export function updateSyncEngine() {
  // no op
}

eventBus.on('USER_LOGGED_OUT', stopAndClearSyncEngineWatcher);
eventBus.on('USER_WAS_UNAUTHORIZED', stopAndClearSyncEngineWatcher);
eventBus.on('INITIAL_SYNC_READY', spawnSyncEngineWorker);

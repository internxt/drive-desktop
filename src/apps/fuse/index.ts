import Logger from 'electron-log';

import _path from 'path';
import { app } from 'electron';
import { getRootVirtualDrive } from '../main/virutal-root-folder/service';
import eventBus from '../main/event-bus';
import { FuseApp } from './FuseApp';
import { DependencyContainerFactory } from './dependency-injection/virtual-drive/DependencyContainerFactory';
import path from 'path';
import { HidratationApi } from '../hydratation-api/HidratationApi';
import { OfflineDriveDependencyContainerFactory } from './dependency-injection/offline/OfflineDriveDependencyContainerFactory';

let fuseApp: FuseApp;

async function spawnSyncEngineWorker() {
  const api = new HidratationApi();

  await api.start({
    debug: false,
  });

  const root = getRootVirtualDrive();

  Logger.debug('ROOT FOLDER: ', root);

  const virtualDriveContainerFactory = new DependencyContainerFactory();
  const virtualDriveContainer = await virtualDriveContainerFactory.build();

  const offlineDriveContainerFactory =
    new OfflineDriveDependencyContainerFactory();
  const offlineDriveContainer = await offlineDriveContainerFactory.build();

  const appData = app.getPath('appData');
  const local = path.join(appData, 'internxt-drive', 'downloaded');

  fuseApp = new FuseApp(virtualDriveContainer, offlineDriveContainer, {
    root,
    local,
  });

  await fuseApp.start();
}

export async function stopSyncEngineWatcher() {
  await fuseApp.stop();
}

async function stopAndClearSyncEngineWatcher() {
  stopSyncEngineWatcher();
}

export function updateSyncEngine() {
  // no op
}

eventBus.on('USER_LOGGED_OUT', stopAndClearSyncEngineWatcher);
eventBus.on('USER_WAS_UNAUTHORIZED', stopAndClearSyncEngineWatcher);
eventBus.on('INITIAL_SYNC_READY', spawnSyncEngineWorker);

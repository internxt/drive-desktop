import Logger from 'electron-log';

import _path from 'path';
import { app } from 'electron';
import { getRootVirtualDrive } from '../main/virutal-root-folder/service';
import eventBus from '../main/event-bus';
import { FuseApp } from './FuseApp';
import { DependencyContainerFactory } from './dependency-injection/DependencyContainerFactory';
import path from 'path';

let fuseApp: FuseApp;

async function spawnSyncEngineWorker() {
  const root = getRootVirtualDrive();

  Logger.debug('ROOT FOLDER: ', root);

  const containerFactory = new DependencyContainerFactory();

  const container = await containerFactory.build();

  const appData = app.getPath('appData');
  const local = path.join(appData, 'internxt-drive', 'downloaded');

  fuseApp = new FuseApp(container, { root, local });

  await fuseApp.start();

  // fuse.isConfigured((err: Error | null, isConfigured: boolean) => {
  //   if (err) {
  //     Logger.error('FUSE ERROR: ', err);
  //   }

  //   Logger.info(`FUSE is configured: ${isConfigured}`);

  //   if (!isConfigured) {
  //     fuse.configure((...params: any[]) => {
  //       Logger.debug(`FUSE configure cb params: ${{ params }}`);
  //     });
  //   }
  // });
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

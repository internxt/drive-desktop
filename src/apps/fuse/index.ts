import Logger from 'electron-log';

import fs, { unlink } from 'fs';
import _path from 'path';
import { app } from 'electron';
import { getRootVirtualDrive } from '../main/virutal-root-folder/service';
import eventBus from '../main/event-bus';
import { FuseApp } from './FuseApp';
import { DependencyContainerFactory } from './dependency-injection/DependencyContainerFactory';

// eslint-disable-next-line @typescript-eslint/no-var-requires
// const fuse = require('@cocalc/fuse-native');
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const fuse = require('@gcas/fuse');

// let _fuse: {
//   unmount(arg0: (err: any) => void): unknown;
//   mount: (arg0: (err: any) => void) => void;
// };

const temp = app.getPath('temp');

const tempFolder = _path.join(temp, 'internxt');

let fuseApp: FuseApp;

async function spawnSyncEngineWorker() {
  await new Promise<void>((resolve) =>
    fs.stat(tempFolder, (err) => {
      if (err) {
        fs.mkdirSync(tempFolder);
      }
      resolve();
    })
  );

  const root = getRootVirtualDrive();

  Logger.debug('ROOT FOLDER: ', root);

  const containerFactory = new DependencyContainerFactory();

  const container = await containerFactory.build();

  fuseApp = new FuseApp(container, { root, local: tempFolder });

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

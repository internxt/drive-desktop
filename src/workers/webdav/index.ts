import Logger from 'electron-log';
import { ipcRenderer } from 'electron';
import { DependencyContainerFactory } from './dependencyInjection/DependencyContainerFactory';
import packageJson from '../../../package.json';
import { BindingsManager } from './BindingManager';
import fs from 'fs/promises';
import { buildControllers } from './app/buildControllers';
import { iconPath } from 'workers/utils/icon';

async function ensureTheFolderExist(path: string) {
  try {
    await fs.access(path);
  } catch {
    Logger.info('ROOT FOLDER ', path, 'NOT FOUND, CREATING IT...');
    await fs.mkdir(path);
  }
}

async function setUp() {
  Logger.debug('STARTING SYNC ENGINE PROCESS');

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { VirtualDrive } = require('virtual-drive/dist');

  const virtualDrivePath = await ipcRenderer.invoke('get-virtual-drive-root');

  Logger.info('WATCHING ON PATH: ', virtualDrivePath);

  await ensureTheFolderExist(virtualDrivePath);

  const virtualDrive = new VirtualDrive(virtualDrivePath);

  ipcRenderer.on('STOP_SYNC_ENGINE_PROCESS', async (event) => {
    await virtualDrive.unregisterSyncRoot();

    event.sender.send('SYNC_ENGINE_STOP_SUCCESS');
  });

  const factory = new DependencyContainerFactory();
  const container = await factory.build();

  const controllers = buildControllers(container);

  const bindings = new BindingsManager(virtualDrive, controllers, {
    root: virtualDrivePath,
    icon: iconPath,
  });

  await bindings.start(
    packageJson.version,
    '{12345678-1234-1234-1234-123456789012}'
  );

  const tree = await container.treeBuilder.run();

  bindings.createPlaceHolders(tree);

  bindings.watch();
}

setUp()
  .then(() => {
    ipcRenderer.emit('SYNC_ENGINE_PROCESS_SETUP_SUCCESSFUL');
  })
  .catch((error) => {
    Logger.error('[SYNC ENGINE] Error setting up', error);
    ipcRenderer.emit('SYNC_ENGINE_PROCESS_SETUP_FAILED');
  });

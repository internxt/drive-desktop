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
    Logger.info(`Folder <${path}> does not exists, goint to  create it`);
    await fs.mkdir(path);
  }
}

async function setUp() {
  Logger.info('[SYNC ENGINE] Starting sync engine process');

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { VirtualDrive } = require('virtual-drive/dist');

  const virtualDrivePath = await ipcRenderer.invoke('get-virtual-drive-root');

  Logger.info(
    '[SYNC ENGINE] Going to create root sync folder on: ',
    virtualDrivePath
  );

  await ensureTheFolderExist(virtualDrivePath);

  const virtualDrive = new VirtualDrive(virtualDrivePath);

  const factory = new DependencyContainerFactory();
  const container = await factory.build();

  const controllers = buildControllers(container);

  const bindings = new BindingsManager(virtualDrive, controllers, {
    root: virtualDrivePath,
    icon: iconPath,
  });

  ipcRenderer.on('STOP_SYNC_ENGINE_PROCESS', async (event) => {
    Logger.info('[SYNC ENGINE] Stoping sync engine');

    await bindings.stop();

    Logger.info('[SYNC ENGINE] sync engine stopped succesfully');

    event.sender.send('SYNC_ENGINE_STOP_SUCCESS');
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
    Logger.info('[SYNC ENGINE] Sync engine has succesfully started');
    ipcRenderer.send('SYNC_ENGINE_PROCESS_SETUP_SUCCESSFUL');
  })
  .catch((error) => {
    Logger.error('[SYNC ENGINE] Error setting up', error);
    ipcRenderer.send('SYNC_ENGINE_PROCESS_SETUP_FAILED');
  });

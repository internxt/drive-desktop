import Logger from 'electron-log';
import { ipcRenderer } from 'electron';
import { DependencyContainerFactory } from './dependency-injection/DependencyContainerFactory';
import packageJson from '../../../package.json';
import { BindingsManager } from './BindingManager';
import fs from 'fs/promises';
import { buildControllers } from './callbacks-controllers/buildControllers';
import { iconPath } from 'workers/utils/icon';

async function ensureTheFolderExist(path: string) {
  try {
    await fs.access(path);
  } catch {
    Logger.info(`Folder <${path}> does not exists, going to  create it`);
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
    Logger.info('[SYNC ENGINE] Stopping sync engine');

    await bindings.stop();

    Logger.info('[SYNC ENGINE] sync engine stopped successfully');

    event.sender.send('SYNC_ENGINE_STOP_SUCCESS');
  });

  ipcRenderer.on('UPDATE_SYNC_ENGINE_PROCESS', async () => {
    Logger.info('[SYNC ENGINE] Updating sync engine');

    await bindings.stop();
    bindings.cleanUp();

    await bindings.start(
      packageJson.version,
      '{E9D7EB38-B229-5DC5-9396-017C449D59CD}'
    );

    const tree = await container.treeBuilder.run();

    bindings.createPlaceHolders(tree);

    Logger.info('[SYNC ENGINE] sync engine updated successfully');
  });

  await bindings.start(
    packageJson.version,
    '{E9D7EB38-B229-5DC5-9396-017C449D59CD}'
  );

  const tree = await container.treeBuilder.run();

  bindings.createPlaceHolders(tree);

  bindings.watch();
}

setUp()
  .then(() => {
    Logger.info('[SYNC ENGINE] Sync engine has successfully started');
    ipcRenderer.send('SYNC_ENGINE_PROCESS_SETUP_SUCCESSFUL');
  })
  .catch((error) => {
    Logger.error('[SYNC ENGINE] Error setting up', error);
    ipcRenderer.send('SYNC_ENGINE_PROCESS_SETUP_FAILED');
  });

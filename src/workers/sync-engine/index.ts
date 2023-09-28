import Logger from 'electron-log';
import { ipcRenderer } from 'electron';
import { DependencyContainerFactory } from './dependency-injection/DependencyContainerFactory';
import packageJson from '../../../package.json';
import { BindingsManager } from './BindingManager';
import fs from 'fs/promises';
import { iconPath } from 'workers/utils/icon';
import { VirtualDrive } from 'virtual-drive/dist';

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

  const virtualDrivePath = await ipcRenderer.invoke('get-virtual-drive-root');

  Logger.info('[SYNC ENGINE] Going to use root folder: ', virtualDrivePath);

  await ensureTheFolderExist(virtualDrivePath);

  const factory = new DependencyContainerFactory();
  const container = await factory.build();

  const bindings = new BindingsManager(container, {
    root: virtualDrivePath,
    icon: iconPath,
  });

  ipcRenderer.on('STOP_SYNC_ENGINE_PROCESS', async (event) => {
    Logger.info('[SYNC ENGINE] Stopping sync engine');

    await bindings.stop();

    Logger.info('[SYNC ENGINE] sync engine stopped successfully');

    event.sender.send('SYNC_ENGINE_STOP_SUCCESS');
  });

  ipcRenderer.on('STOP_AND_CLEAR_SYNC_ENGINE_PROCESS', async (event) => {
    Logger.info('[SYNC ENGINE] Stopping and clearing sync engine');

    try {
      await bindings.stop();

      VirtualDrive.unregisterSyncRoot(virtualDrivePath);

      Logger.info('[SYNC ENGINE] sync engine stopped successfully');

      event.sender.send('SYNC_ENGINE_STOP_AND_CLEAR_SUCCESS');
    } catch (error: unknown) {
      Logger.error('[SYNC ENGINE] Error stopping and cleaning: ', error);
      event.sender.send('ERROR_ON_STOP_AND_CLEAR_SYNC_ENGINE_PROCESS');
    }
  });

  await bindings.start(
    packageJson.version,
    '{E9D7EB38-B229-5DC5-9396-017C449D59CD}'
  );

  container.treePlaceholderCreator.run();

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

import Logger from 'electron-log';
import { ipcRenderer } from 'electron';
import { SyncEngineDependencyContainerFactory } from './dependency-injection/SyncEngineDependencyContainerFactory';
import packageJson from '../../../package.json';
import { BindingsManager } from './BindingManager';
import fs from 'fs/promises';
import { iconPath } from '../utils/icon';

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

  const factory = new SyncEngineDependencyContainerFactory();
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

  ipcRenderer.on('UPDATE_SYNC_ENGINE_PROCESS', async () => {
    Logger.info('[SYNC ENGINE] Updating sync engine');

    await bindings.update();

    Logger.info('[SYNC ENGINE] sync engine updated successfully');
  });

  ipcRenderer.on('STOP_AND_CLEAR_SYNC_ENGINE_PROCESS', async (event) => {
    Logger.info('[SYNC ENGINE] Stopping and clearing sync engine');

    try {
      await bindings.stop();
      await bindings.cleanUp();

      Logger.info('[SYNC ENGINE] sync engine stopped and cleared successfully');

      event.sender.send('SYNC_ENGINE_STOP_AND_CLEAR_SUCCESS');
    } catch (error: unknown) {
      Logger.error('[SYNC ENGINE] Error stopping and cleaning: ', error);
      event.sender.send('ERROR_ON_STOP_AND_CLEAR_SYNC_ENGINE_PROCESS');
    }
  });

  ipcRenderer.on('SYNC_ENGINE:PING', (event) => {
    event.sender.send('SYNC_ENGINE:PONG');
  });

  await bindings.start(
    packageJson.version,
    '{E9D7EB38-B229-5DC5-9396-017C449D59CD}'
  );

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

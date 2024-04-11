import Logger from 'electron-log';
import { ipcRenderer } from 'electron';
import { DependencyContainerFactory } from './dependency-injection/DependencyContainerFactory';
import packageJson from '../../../package.json';
import { BindingsManager } from './BindingManager';
import fs from 'fs/promises';
import { iconPath } from '../utils/icon';
import * as Sentry from '@sentry/electron/renderer';
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

  ipcRenderer.on('CHECK_SYNC_ENGINE_RESPONSE', async (event) => {
    Logger.info('[SYNC ENGINE] Checking sync engine response');
    const placeholderStatuses = await container.filesCheckerStatusInRoot.run();
    const placeholderStates = placeholderStatuses;
    event.sender.send('CHECK_SYNC_CHANGE_STATUS', placeholderStates);
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

  ipcRenderer.on('FALLBACK_SYNC_ENGINE_PROCESS', async () => {
    Logger.info('[SYNC ENGINE] Fallback sync engine');

    await bindings.polling();

    Logger.info('[SYNC ENGINE] sync engine fallback successfully');
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
      Sentry.captureException(error);
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

  ipcRenderer.send('CHECK_SYNC');
}

setUp()
  .then(() => {
    Logger.info('[SYNC ENGINE] Sync engine has successfully started');
    ipcRenderer.send('SYNC_ENGINE_PROCESS_SETUP_SUCCESSFUL');
  })
  .catch((error) => {
    Logger.error('[SYNC ENGINE] Error setting up', error);
    Sentry.captureException(error);
    if (error.toString().includes('Error: ConnectSyncRoot failed')) {
      Sentry.captureMessage('ConnectSyncRoot failed');
      Logger.info('[SYNC ENGINE] We neeed to restart the app virtual drive');
    }
    ipcRenderer.send('SYNC_ENGINE_PROCESS_SETUP_FAILED');
  });

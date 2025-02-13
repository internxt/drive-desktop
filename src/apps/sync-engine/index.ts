import Logger from 'electron-log';
import { ipcRenderer } from 'electron';
import { DependencyContainerFactory } from './dependency-injection/DependencyContainerFactory';
import packageJson from '../../../package.json';
import { BindingsManager } from './BindingManager';
import fs from 'fs/promises';
import { iconPath } from '../utils/icon';
import * as Sentry from '@sentry/electron/renderer';
import { VirtualDrive } from 'virtual-drive/dist';
import { setConfig, Config, getConfig } from './config';

Logger.log(`Running sync engine ${packageJson.version}`);

function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    enabled: true, // it is true but is using app.isPackaged from the main process
  });
  Sentry.captureMessage('Sync engine process started');
}

initSentry();

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

  const { rootPath, providerName } = getConfig();

  Logger.info('[SYNC ENGINE] Going to use root folder: ', rootPath);

  await ensureTheFolderExist(rootPath);

  const factory = new DependencyContainerFactory();

  const container = await factory.build();

  const bindings = new BindingsManager(
    container,
    {
      root: rootPath,
      icon: iconPath,
    },
    providerName,
  );

  ipcRenderer.on('USER_LOGGED_OUT', async () => {
    bindings.cleanQueue();
  });

  ipcRenderer.on('CHECK_SYNC_ENGINE_RESPONSE', async (event) => {
    Logger.info('[SYNC ENGINE] Checking sync engine response');
    const placeholderStatuses = await container.filesCheckerStatusInRoot.run();
    const placeholderStates = placeholderStatuses;
    event.sender.send('CHECK_SYNC_CHANGE_STATUS', placeholderStates);
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

  ipcRenderer.on('UPDATE_UNSYNC_FILE_IN_SYNC_ENGINE_PROCESS', async (event) => {
    Logger.info('[SYNC ENGINE] updating file unsync');

    const filesPending = await bindings.getFileInSyncPending();

    event.sender.send('UPDATE_UNSYNC_FILE_IN_SYNC_ENGINE', filesPending);
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

  await bindings.start(packageJson.version);

  await bindings.watch();

  Logger.info('[SYNC ENGINE] Second sync engine started');

  ipcRenderer.send('CHECK_SYNC');
}
ipcRenderer.once('SET_CONFIG', (event, config: Config) => {
  Logger.info('[SYNC ENGINE] Setting config:', config);
  setConfig(config);
  setUp()
    .then(() => {
      Logger.info('[SYNC ENGINE] Sync engine has successfully started');
      ipcRenderer.send('SYNC_ENGINE_PROCESS_SETUP_SUCCESSFUL');
    })
    .catch((error) => {
      Logger.error('[SYNC ENGINE] Error setting up', error);
      Sentry.captureException(error);
      if (error.toString().includes('Error: ConnectSyncRoot failed')) {
        Logger.info('[SYNC ENGINE] We neeed to restart the app virtual drive');
        Sentry.captureMessage('Restarting sync engine virtual drive is required');
      }
      ipcRenderer.send('SYNC_ENGINE_PROCESS_SETUP_FAILED');
    });
});

import Logger from 'electron-log';
import { ipcRenderer } from 'electron';
import { DependencyContainerFactory } from './dependency-injection/DependencyContainerFactory';
import { BindingsManager } from './BindingManager';
import fs from 'fs/promises';
import * as Sentry from '@sentry/electron/renderer';
import { setConfig, Config, getConfig, setDefaultConfig } from './config';
import { logger } from '../shared/logger/logger';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { File, FileAttributes } from '@/context/virtual-drive/files/domain/File';
import { Folder, FolderAttributes } from '@/context/virtual-drive/folders/domain/Folder';

logger.debug({ msg: 'Running sync engine' });

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

  const container = DependencyContainerFactory.build();

  const bindings = new BindingsManager(container, providerName);

  ipcRenderer.on('UPDATE_SYNC_ENGINE_PROCESS', async () => {
    await bindings.updateAndCheckPlaceholders();
  });

  ipcRenderer.on('STOP_AND_CLEAR_SYNC_ENGINE_PROCESS', (event) => {
    Logger.info('[SYNC ENGINE] Stopping and clearing sync engine');

    try {
      bindings.stop();

      Logger.info('[SYNC ENGINE] sync engine stopped and cleared successfully');

      event.sender.send('SYNC_ENGINE_STOP_AND_CLEAR_SUCCESS');
    } catch (error: unknown) {
      Logger.error('[SYNC ENGINE] Error stopping and cleaning: ', error);
      Sentry.captureException(error);
      event.sender.send('ERROR_ON_STOP_AND_CLEAR_SYNC_ENGINE_PROCESS');
    }
  });

  ipcRenderer.on('UPDATE_FILE_PLACEHOLDER', async (_, fileAttributes: FileAttributes) => {
    try {
      const file = File.from(fileAttributes);
      await container.filesPlaceholderUpdater.update(file);
    } catch (exc) {
      logger.error({
        msg: 'Error updating file placeholder',
        exc,
      });
    }
  });

  ipcRenderer.on('UPDATE_FOLDER_PLACEHOLDER', async (_, folderAttributes: FolderAttributes) => {
    try {
      const folder = Folder.from(folderAttributes);
      await container.folderPlaceholderUpdater.update(folder);
    } catch (exc) {
      logger.error({
        msg: 'Error updating folder placeholder',
        exc,
      });
    }
  });

  await bindings.start();
  await bindings.watch();

  Logger.info('[SYNC ENGINE] Second sync engine started');
}

async function refreshToken() {
  logger.debug({ msg: '[SYNC ENGINE] Refreshing token' });
  const { data: credentials } = await driveServerWipModule.workspaces.getCredentials({ workspaceId: getConfig().workspaceId });

  if (credentials) {
    const newToken = credentials.tokenHeader;
    setDefaultConfig({ workspaceToken: newToken });
  }
}

ipcRenderer.once('SET_CONFIG', (event, config: Config) => {
  setConfig(config);

  if (config.workspaceToken) {
    setInterval(refreshToken, 23 * 60 * 60 * 1000);
  }

  setUp()
    .then(() => {
      Logger.info('[SYNC ENGINE] Sync engine has successfully started');
      ipcRenderer.send('SYNC_ENGINE_PROCESS_SETUP_SUCCESSFUL', config.workspaceId);
    })
    .catch((error) => {
      Logger.error('[SYNC ENGINE] Error setting up', error);
      Sentry.captureException(error);
      if (error.toString().includes('Error: ConnectSyncRoot failed')) {
        Logger.info('[SYNC ENGINE] We need to restart the app virtual drive');
        Sentry.captureMessage('Restarting sync engine virtual drive is required');
      }
      ipcRenderer.send('SYNC_ENGINE_PROCESS_SETUP_FAILED', config.workspaceId);
    });
});

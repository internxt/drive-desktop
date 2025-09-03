import { ipcRenderer } from 'electron';
import { DependencyContainerFactory } from './dependency-injection/DependencyContainerFactory';
import { BindingsManager } from './BindingManager';
import fs from 'fs/promises';
import { setConfig, Config, getConfig, setDefaultConfig, ProcessSyncContext } from './config';
import { logger } from '../shared/logger/logger';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { initializeVirtualDrive, virtualDrive } from './dependency-injection/common/virtualDrive';
import { ipcRendererSyncEngine } from './ipcRendererSyncEngine';
import { buildFileUploader } from '../main/background-processes/backups/build-file-uploader';

logger.debug({ msg: 'Running sync engine' });

async function ensureTheFolderExist(path: string) {
  try {
    await fs.access(path);
  } catch {
    logger.debug({ msg: `Folder <${path}> does not exists, going to  create it` });
    await fs.mkdir(path);
  }
}

async function setUp({ ctx }: { ctx: ProcessSyncContext }) {
  logger.debug({ msg: '[SYNC ENGINE] Starting sync engine process' });

  const { rootPath } = getConfig();

  logger.debug({ msg: '[SYNC ENGINE] Going to use root folder: ', rootPath });

  await ensureTheFolderExist(rootPath);

  const container = DependencyContainerFactory.build({ ctx });

  const bindings = new BindingsManager(container);

  ipcRendererSyncEngine.on('UPDATE_SYNC_ENGINE_PROCESS', async () => {
    await bindings.updateAndCheckPlaceholders({ ctx });
  });

  ipcRendererSyncEngine.on('STOP_AND_CLEAR_SYNC_ENGINE_PROCESS', (event) => {
    logger.debug({ msg: '[SYNC ENGINE] Stopping and clearing sync engine' });

    try {
      bindings.stop();

      logger.debug({ msg: '[SYNC ENGINE] sync engine stopped and cleared successfully' });

      event.sender.send('SYNC_ENGINE_STOP_AND_CLEAR_SUCCESS');
    } catch (error: unknown) {
      logger.error({ msg: '[SYNC ENGINE] Error stopping and cleaning: ', error });
      event.sender.send('ERROR_ON_STOP_AND_CLEAR_SYNC_ENGINE_PROCESS');
    }
  });

  await bindings.start({ ctx });
  bindings.watch({ ctx });

  logger.debug({ msg: '[SYNC ENGINE] Second sync engine started' });
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

  initializeVirtualDrive();

  const { fileUploader } = buildFileUploader({ bucket: config.bucket });
  const ctx: ProcessSyncContext = {
    ...config,
    abortController: new AbortController(),
    virtualDrive,
    fileUploader,
  };

  if (config.workspaceToken) {
    setInterval(refreshToken, 23 * 60 * 60 * 1000);
  }

  setUp({ ctx })
    .then(() => {
      logger.debug({ msg: '[SYNC ENGINE] Sync engine has successfully started' });
      ipcRenderer.send('SYNC_ENGINE_PROCESS_SETUP_SUCCESSFUL', config.workspaceId);
    })
    .catch((error) => {
      logger.error({ msg: '[SYNC ENGINE] Error setting up', error });
      if (error.toString().includes('Error: ConnectSyncRoot failed')) {
        logger.debug({ msg: '[SYNC ENGINE] We need to restart the app virtual drive' });
      }
      ipcRenderer.send('SYNC_ENGINE_PROCESS_SETUP_FAILED', config.workspaceId);
    });
});

import { ipcRenderer } from 'electron';
import { BindingsManager } from './BindingManager';
import { setConfig, setDefaultConfig, ProcessSyncContext, Config } from './config';
import { logger } from '../shared/logger/logger';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { ipcRendererSyncEngine } from './ipcRendererSyncEngine';
import { buildFileUploader } from '../main/background-processes/backups/build-file-uploader';
import VirtualDrive from '@/node-win/virtual-drive';
import { runDangledFiles } from './run-dangled-files';
import { buildProcessContainer } from './build-process-container';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { mkdir } from 'fs/promises';

logger.debug({ msg: 'Running sync engine' });

async function createRootFolder({ ctx }: { ctx: ProcessSyncContext }) {
  const { error } = await fileSystem.stat({ absolutePath: ctx.rootPath });

  if (error) {
    logger.debug({ tag: 'SYNC-ENGINE', msg: 'Create sync root folder', code: error.code });
    await mkdir(ctx.rootPath, { recursive: true });
  }
}

async function setUp({ ctx }: { ctx: ProcessSyncContext }) {
  logger.debug({ msg: '[SYNC ENGINE] Starting sync engine process' });

  const { rootPath } = ctx;

  logger.debug({ msg: '[SYNC ENGINE] Going to use root folder: ', rootPath });

  const container = buildProcessContainer({ ctx });

  ipcRendererSyncEngine.on('UPDATE_SYNC_ENGINE_PROCESS', async () => {
    await BindingsManager.updateAndCheckPlaceholders({ ctx });
  });

  ipcRendererSyncEngine.on('STOP_AND_CLEAR_SYNC_ENGINE_PROCESS', (event) => {
    logger.debug({ msg: '[SYNC ENGINE] Stopping and clearing sync engine' });

    try {
      BindingsManager.stop({ ctx });

      logger.debug({ msg: '[SYNC ENGINE] sync engine stopped and cleared successfully' });

      event.sender.send('SYNC_ENGINE_STOP_AND_CLEAR_SUCCESS');
    } catch (error: unknown) {
      logger.error({ msg: '[SYNC ENGINE] Error stopping and cleaning: ', error });
      event.sender.send('ERROR_ON_STOP_AND_CLEAR_SYNC_ENGINE_PROCESS');
    }
  });

  await BindingsManager.start({ ctx, container });
  BindingsManager.watch({ ctx });
  void runDangledFiles({ ctx, container });

  logger.debug({ msg: '[SYNC ENGINE] Second sync engine started' });
}

async function refreshToken({ ctx }: { ctx: ProcessSyncContext }) {
  logger.debug({ msg: '[SYNC ENGINE] Refreshing token' });
  const { data: credentials } = await driveServerWipModule.workspaces.getCredentials({ workspaceId: ctx.workspaceId });

  if (credentials) {
    const newToken = credentials.tokenHeader;
    setDefaultConfig({ workspaceToken: newToken });
  }
}

ipcRenderer.once('SET_CONFIG', async (event, config: Config) => {
  try {
    setConfig(config);

    const { fileUploader } = buildFileUploader({ bucket: config.bucket });
    const ctx: ProcessSyncContext = {
      ...config,
      abortController: new AbortController(),
      virtualDrive: new VirtualDrive(config),
      fileUploader,
    };

    await createRootFolder({ ctx });

    if (config.workspaceToken) {
      setInterval(() => refreshToken({ ctx }), 23 * 60 * 60 * 1000);
    }

    await setUp({ ctx });

    logger.debug({ msg: '[SYNC ENGINE] Sync engine has successfully started' });
    ipcRenderer.send('SYNC_ENGINE_PROCESS_SETUP_SUCCESSFUL', config.workspaceId);
  } catch (exc) {
    logger.error({ msg: '[SYNC ENGINE] Error setting up', exc });
    ipcRenderer.send('SYNC_ENGINE_PROCESS_SETUP_FAILED', config.workspaceId);
  }
});

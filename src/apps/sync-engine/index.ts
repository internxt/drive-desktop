import { ipcRenderer } from 'electron';
import { BindingsManager } from './BindingManager';
import { setConfig, setDefaultConfig, ProcessSyncContext, Config } from './config';
import { createLogger, logger } from '../shared/logger/logger';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { ipcRendererSyncEngine } from './ipcRendererSyncEngine';
import { buildFileUploader } from '../main/background-processes/backups/build-file-uploader';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { InxtJs } from '@/infra';
import { refreshItemPlaceholders } from './refresh-item-placeholders';
import { checkDangledFiles } from './dangled-files/check-dangled-files';

logger.debug({ msg: 'Running sync engine' });

async function setUp({ ctx }: { ctx: ProcessSyncContext }) {
  logger.debug({ msg: '[SYNC ENGINE] Starting sync engine process' });

  const { rootPath } = ctx;

  logger.debug({ msg: '[SYNC ENGINE] Going to use root folder: ', rootPath });

  await VirtualDrive.createSyncRootFolder({ rootPath });

  await BindingsManager.start({ ctx });

  ipcRendererSyncEngine.on('UPDATE_SYNC_ENGINE_PROCESS', async () => {
    await refreshItemPlaceholders({ ctx });
  });

  BindingsManager.watch({ ctx });

  void checkDangledFiles({ ctx });
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

    const { fileUploader, environment } = buildFileUploader({ bucket: config.bucket });
    const contentsDownloader = new InxtJs.ContentsDownloader(environment, config.bucket);

    const ctx: ProcessSyncContext = {
      ...config,
      logger: createLogger({ tag: 'SYNC-ENGINE', workspaceId: config.workspaceId }),
      abortController: new AbortController(),
      fileUploader,
      contentsDownloader,
    };

    if (config.workspaceToken) {
      setInterval(() => refreshToken({ ctx }), 23 * 60 * 60 * 1000);
    }

    await setUp({ ctx });

    logger.debug({ msg: '[SYNC ENGINE] Sync engine has successfully started' });
  } catch (exc) {
    logger.error({ msg: '[SYNC ENGINE] Error setting up', exc });
  }
});

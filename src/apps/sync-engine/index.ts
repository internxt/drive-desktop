import { ipcRenderer } from 'electron';
import { BindingsManager } from './BindingManager';
import { setConfig, ProcessSyncContext, Config } from './config';
import { createLogger, logger } from '../shared/logger/logger';
import { buildEnvironment } from '../main/background-processes/backups/build-environment';
import { refreshWorkspaceToken } from './refresh-workspace-token';

logger.debug({ msg: 'Running sync engine' });

function setUp({ ctx }: { ctx: ProcessSyncContext }) {
  logger.debug({ msg: '[SYNC ENGINE] Starting sync engine process' });

  const { rootPath } = ctx;

  logger.debug({ msg: '[SYNC ENGINE] Going to use root folder: ', rootPath });

  BindingsManager.start({ ctx });
}

ipcRenderer.once('SET_CONFIG', (event, config: Config) => {
  try {
    setConfig(config);

    const { fileUploader, contentsDownloader } = buildEnvironment({
      bucket: config.bucket,
      bridgePass: config.bridgePass,
      bridgeUser: config.bridgeUser,
      mnemonic: config.mnemonic,
    });

    const ctx: ProcessSyncContext = {
      ...config,
      logger: createLogger({ tag: 'SYNC-ENGINE', workspaceId: config.workspaceId }),
      abortController: new AbortController(),
      fileUploader,
      contentsDownloader,
    };

    if (config.workspaceToken) {
      refreshWorkspaceToken({ ctx });
    }

    setUp({ ctx });

    logger.debug({ msg: '[SYNC ENGINE] Sync engine has successfully started' });
  } catch (exc) {
    logger.error({ msg: '[SYNC ENGINE] Error setting up', exc });
  }
});

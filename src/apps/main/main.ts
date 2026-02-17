import { app, crashReporter } from 'electron';

import 'reflect-metadata';
import 'core-js/stable';
import 'regenerator-runtime/runtime';
// Only effective during development
// the variables are injected if process.env.NODE_ENV === 'production'
// via webpack in prod
import 'dotenv/config';

// ***** APP BOOTSTRAPPING ****************************************************** //
import { PATHS } from '@/core/electron/paths';
import { setupElectronLog } from '@internxt/drive-desktop-core/build/backend';

import { setupAutoLaunchHandlers } from './auto-launch/handlers';
import { checkIfUserIsLoggedIn, emitUserLoggedIn, setIsLoggedIn, setupAuthIpcHandlers } from './auth/handlers';
import { setupDeviceIpc } from './device/handlers';
import { setupAntivirusIpc } from './ipcs/ipcMainAntivirus';
import { setupRemoteSyncIpc } from './remote-sync/handlers';

import { autoUpdater } from 'electron-updater';
import { AppDataSource } from './database/data-source';
import { createWidget } from './windows/widget';
import { setTrayStatus, setupTrayIcon } from './tray/tray';
import { setupQuitHandlers } from './quit';
import { migrate } from '@/migrations/migrate';
import { setUpBackups } from './background-processes/backups/setUpBackups';
import { setupIssueHandlers } from './background-processes/issues';
import { logger } from '../shared/logger/logger';
import { INTERNXT_APP_ID, INTERNXT_PROTOCOL, INTERNXT_VERSION } from '@/core/utils/utils';
import { setupPreloadIpc } from './preload/ipc-main';
import { setupThemeListener } from './config/theme';
import { release, version } from 'node:os';
import { processDeeplink } from './electron/deeplink/process-deeplink';
import { resolve } from 'node:path';
import { isAbortError } from '@/infra/drive-server-wip/in/helpers/error-helpers';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';

app.setPath('crashDumps', join(PATHS.LOGS, 'crash'));
crashReporter.start({ uploadToServer: false, compress: false });

setupElectronLog({ logsPath: PATHS.LOGS });

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    /**
     * v2.6.2 Daniel Jiménez
     * To be able to use main.js we must first build it using `npm run build:main`.
     */
    logger.debug({ msg: 'Registering protocol in dev mode' });
    app.setAsDefaultProtocolClient(INTERNXT_PROTOCOL, process.execPath, [resolve('./dist/main/main.js')]);
  }
} else {
  logger.debug({ msg: 'Registering protocol' });
  app.setAsDefaultProtocolClient(INTERNXT_PROTOCOL);
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
  process.exit(0);
} else {
  app.on('second-instance', (event, argv) => {
    processDeeplink({ argv });
  });
}

setupAutoLaunchHandlers();
setupAuthIpcHandlers();
setupPreloadIpc();
setupThemeListener();
setupQuitHandlers();
setupIssueHandlers();
setupDeviceIpc();
setupAntivirusIpc();
setupRemoteSyncIpc();

logger.debug({
  msg: 'Starting app',
  gotTheLock,
  version: INTERNXT_VERSION,
  isPackaged: app.isPackaged,
  osVersion: version(),
  osRelease: release(),
});

async function checkForUpdates() {
  autoUpdater.logger = {
    debug: (msg) => logger.debug({ msg: `AutoUpdater: ${msg}` }),
    info: (msg) => logger.debug({ msg: `AutoUpdater: ${msg}` }),
    error: (msg) => logger.error({ msg: `AutoUpdater: ${msg}` }),
    warn: (msg) => logger.warn({ msg: `AutoUpdater: ${msg}` }),
  };
  await autoUpdater.checkForUpdatesAndNotify();
}

if (process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

process.on('unhandledRejection', (error, promise) => {
  if (isAbortError({ exc: error })) return;

  logger.error({ msg: 'Unhandled rejection', error, promise });
});

process.on('uncaughtException', (error, origin) => {
  logger.error({ msg: 'Uncaught exception', error, origin });
});

app
  .whenReady()
  .then(async () => {
    app.setAppUserModelId(INTERNXT_APP_ID);

    await AppDataSource.initialize();
    await migrate();

    setupTrayIcon();
    await createWidget();

    const isLoggedIn = checkIfUserIsLoggedIn();

    if (isLoggedIn) {
      setIsLoggedIn(true);
      await emitUserLoggedIn();
    } else {
      setIsLoggedIn(false);
      setTrayStatus('IDLE');
    }

    setUpBackups();

    await checkForUpdates();
    setInterval(checkForUpdates, 60 * 60 * 1000);
  })
  .catch((exc) => logger.error({ msg: 'Error starting app', exc }));

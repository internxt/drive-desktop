import { setupElectronLog } from '@internxt/drive-desktop-core/build/backend';
import 'core-js/stable';
// Only effective during development
// the variables are injected if process.env.NODE_ENV === 'production'
// via webpack in prod
import 'dotenv/config';
import { app, crashReporter } from 'electron';
import { autoUpdater } from 'electron-updater';
import { arch, release, version } from 'node:os';
import { resolve } from 'node:path';
import 'reflect-metadata';
import 'regenerator-runtime/runtime';
import { captureSentryException, initSentry } from '@/apps/shared/sentry/sentry';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { PATHS } from '@/core/electron/paths';
import { measureHealth } from '@/core/utils/measure-health';
import { INTERNXT_APP_ID, INTERNXT_PROTOCOL, INTERNXT_VERSION } from '@/core/utils/utils';
import { isAbortError } from '@/infra/drive-server-wip/in/helpers/error-helpers';
import { runMigrations } from '@/infra/sqlite/migrations/run-migrations';
import { applyE2EConfiguration } from '@/tests/e2e/helpers/e2e-configuration.helper';
import { logger } from '../shared/logger/logger';
import { checkIfUserIsLoggedIn, emitUserLoggedIn, setIsLoggedIn, setupAuthIpcHandlers } from './auth/handlers';
import { setupAutoLaunchHandlers } from './auto-launch/handlers';
import { setUpBackups } from './background-processes/backups/setUpBackups';
import { setupIssueHandlers } from './background-processes/issues';
import { setupThemeListener } from './config/theme';
import { setupDeviceIpc } from './device/handlers';
import { processDeeplink } from './electron/deeplink/process-deeplink';
import { setupAntivirusIpc } from './ipcs/ipcMainAntivirus';
import { setupPreloadIpc } from './preload/ipc-main';
import { setupQuitHandlers } from './quit';
import { setupRemoteSyncIpc } from './remote-sync/handlers';
import { setTrayStatus, setupTrayIcon } from './tray/tray';
import { createWidget, showFrontend } from './windows/widget';

if (process.env.E2E_TEST === 'true') {
  logger.debug({ msg: 'Applying e2e configuration for playwright tests' });
  applyE2EConfiguration();
}

app.setPath('crashDumps', join(PATHS.LOGS, 'crash'));
crashReporter.start({ uploadToServer: false, compress: false });

setupElectronLog({ logsPath: PATHS.LOGS });

initSentry();

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
  arch: arch(),
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
  if (isAbortError({ error })) return;

  logger.error({ msg: 'Unhandled rejection', error, promise });
  captureSentryException(error, { promise, type: 'unhandledRejection' });
});

process.on('uncaughtException', (error, origin) => {
  logger.error({ msg: 'Uncaught exception', error, origin });
  captureSentryException(error, { origin, type: 'uncaughtException' });
});

app
  .whenReady()
  .then(async () => {
    app.setAppUserModelId(INTERNXT_APP_ID);

    runMigrations();
    setupTrayIcon();

    const user = checkIfUserIsLoggedIn();
    await createWidget();

    if (user) {
      await emitUserLoggedIn(user);
    } else {
      setIsLoggedIn(null);
      showFrontend();
      setTrayStatus('IDLE');
    }

    setUpBackups();

    measureHealth();
    await checkForUpdates();
    setInterval(checkForUpdates, 60 * 60 * 1000);
  })
  .catch((exc) => logger.error({ msg: 'Error starting app', exc }));
